/**
 * Google Drive API client wrapper.
 * Provides typed methods for folder/file operations using the Drive v3 API.
 */

// Google Drive API v3 base URL
const DRIVE_API = "https://www.googleapis.com/drive/v3";

// Google Drive file upload endpoint
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

/** Metadata for a file listed from Google Drive */
export interface IDriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

/**
 * Client for Google Drive API operations.
 * Uses an OAuth2 access token for authentication.
 */
export class GoogleDriveClient {
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Create a folder in Google Drive.
   * Returns the folder ID.
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata: Record<string, unknown> = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };

    if (parentId) {
      metadata.parents = [parentId];
    }

    const response = await fetch(`${DRIVE_API}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const data = (await response.json()) as { id: string };
    return data.id;
  }

  /**
   * Upload a file to Google Drive using multipart upload.
   * Returns the file ID.
   */
  async uploadFile(
    name: string,
    content: string,
    mimeType: string,
    folderId: string
  ): Promise<string> {
    // Build multipart request body
    const boundary = "shd_planner_boundary";
    const metadata = JSON.stringify({
      name,
      parents: [folderId],
    });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const response = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const data = (await response.json()) as { id: string };
    return data.id;
  }

  /**
   * List files in a specific folder.
   * Returns file metadata sorted by modified time (newest first).
   */
  async listFiles(folderId: string): Promise<IDriveFile[]> {
    const query = `'${folderId}' in parents and trashed = false`;
    const params = new URLSearchParams({
      q: query,
      fields: "files(id, name, modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: "100",
    });

    const response = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = (await response.json()) as { files: IDriveFile[] };
    return data.files ?? [];
  }

  /**
   * Download a file's content by ID.
   * Returns the raw text content.
   */
  async downloadFile(fileId: string): Promise<string> {
    const response = await fetch(
      `${DRIVE_API}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Find a folder by name in the root (or optionally in a parent folder).
   * Returns the folder ID or null if not found.
   */
  async findFolder(name: string, parentId?: string): Promise<string | null> {
    const parent = parentId ?? "root";
    const query =
      `name = '${name}' and '${parent}' in parents ` +
      `and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const params = new URLSearchParams({
      q: query,
      fields: "files(id)",
      pageSize: "1",
    });

    const response = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search folders: ${response.statusText}`);
    }

    const data = (await response.json()) as { files: Array<{ id: string }> };
    return data.files.length > 0 ? data.files[0].id : null;
  }
}
