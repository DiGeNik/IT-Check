import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Неуспешно получаване на токен за достъп от Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export async function listDriveFolderContents(
  token: string,
  folderId = 'root',
  query = '',
  mimeFilter = 'all'
): Promise<DriveFileItem[]> {
  try {
    const qParts = ['trashed = false'];

    if (query.trim()) {
      const sanitized = query.replace(/['\\]/g, '');
      qParts.push(`name contains '${sanitized}'`);
    } else {
      qParts.push(`'${folderId}' in parents`);
    }

    if (mimeFilter === 'pdf') {
      qParts.push(`(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/pdf')`);
    } else if (mimeFilter === 'docx') {
      qParts.push(`(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`);
    } else if (mimeFilter === 'docs') {
      qParts.push(`(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.document')`);
    } else if (mimeFilter === 'images') {
      qParts.push(`(mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/')`);
    } else if (mimeFilter === 'txt') {
      qParts.push(`(mimeType = 'application/vnd.google-apps.folder' or mimeType = 'text/plain')`);
    } else {
      // General filter: show all folders PLUS worksheet documents
      qParts.push(
        `(mimeType = 'application/vnd.google-apps.folder' or ` +
        `mimeType = 'application/pdf' or ` +
        `mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or ` +
        `mimeType = 'application/vnd.google-apps.document' or ` +
        `mimeType = 'text/plain' or ` +
        `mimeType contains 'image/')`
      );
    }

    const q = qParts.join(' and ');
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('fields', 'files(id, name, mimeType, size, modifiedTime, thumbnailLink)');
    url.searchParams.set('orderBy', 'folder,name_natural asc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Грешка от Google Drive: HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawFiles: any[] = data.files || [];

    const items: DriveFileItem[] = rawFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
      size: f.size,
      modifiedTime: f.modifiedTime,
      thumbnailLink: f.thumbnailLink,
    }));

    // Sort: Folders first, then files
    items.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name, 'bg');
    });

    return items;
  } catch (err: any) {
    console.error('Error listing Drive folder contents:', err);
    throw err;
  }
}

export async function fetchAllFilesInsideFolder(token: string, folderId: string): Promise<DriveFileItem[]> {
  try {
    const q = `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder' and (` +
      `mimeType = 'application/pdf' or ` +
      `mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or ` +
      `mimeType = 'application/vnd.google-apps.document' or ` +
      `mimeType = 'text/plain' or ` +
      `mimeType contains 'image/')`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', q);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('fields', 'files(id, name, mimeType, size, modifiedTime)');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Грешка при четене на файлове от папката: HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawFiles: any[] = data.files || [];

    return rawFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: false,
      size: f.size,
      modifiedTime: f.modifiedTime,
    }));
  } catch (err) {
    console.error('Error fetching files in folder:', err);
    throw err;
  }
}

export async function downloadDriveFile(token: string, file: DriveFileItem): Promise<File> {
  const isGoogleDoc = file.mimeType === 'application/vnd.google-apps.document';

  let downloadUrl = '';
  let finalMimeType = file.mimeType;
  let finalFileName = file.name;

  if (isGoogleDoc) {
    // Export Google Docs as plain text
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
    finalMimeType = 'text/plain';
    if (!finalFileName.endsWith('.txt')) {
      finalFileName += '.txt';
    }
  } else {
    // Regular binary or media file
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  }

  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Грешка при сваляне на "${file.name}": HTTP ${res.status}`);
  }

  const blob = await res.blob();
  return new File([blob], finalFileName, { type: finalMimeType });
}
