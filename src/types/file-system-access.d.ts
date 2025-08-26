// Type declarations for File System Access API
declare global {
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
    showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemFileHandle {
    requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>
    createWritable(): Promise<FileSystemWritableFileStream>
    getFile(): Promise<File>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | ArrayBuffer | Blob): Promise<void>
    close(): Promise<void>
  }

  interface OpenFilePickerOptions {
    types?: FilePickerAcceptType[]
    multiple?: boolean
    excludeAcceptAllOption?: boolean
  }

  interface SaveFilePickerOptions {
    suggestedName?: string
    types?: FilePickerAcceptType[]
    excludeAcceptAllOption?: boolean
  }

  interface DirectoryPickerOptions {
    mode?: 'read' | 'readwrite'
  }

  interface FilePickerAcceptType {
    description?: string
    accept: Record<string, string[]>
  }
}

export {}