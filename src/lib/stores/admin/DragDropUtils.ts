//
// Below this is code to handle drag and drop, could be separate file
//

// export async function dropImages(e: DragEvent) {
//     const files = await getDroppedImages(e);
//     const albumPath = page.url.pathname + '/';
//     await upload(files, albumPath);
// }

export async function getDroppedImages(e: DragEvent): Promise<File[]> {
    e.preventDefault(); // Prevent default behavior, which is the browser opening the files
    let files: File[] = [];
    if (!e.dataTransfer) {
        console.log('No dataTransfer');
        return files;
    }
    if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (const item of e.dataTransfer.items) {
            const itemEntry = item.webkitGetAsEntry();
            if (itemEntry?.isDirectory) {
                const x = await getFilesInDirectory(itemEntry as FileSystemDirectoryEntry);
                files = files.concat(x);
            } else if (itemEntry?.isFile) {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                } else {
                    console.log(`There warn't no file name in ${file}`);
                }
            } else {
                console.log(`Unrecognized type of file`, item, itemEntry);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        [...e.dataTransfer.files].forEach((file) => {
            files.push(file);
        });
    }
    return files;
}

/**
 * Get all the File objects in a directory
 */
async function getFilesInDirectory(directory: FileSystemDirectoryEntry): Promise<File[]> {
    const files: File[] = [];
    const entries = await readAllDirectoryEntries(directory);
    for (const entry of entries) {
        if (entry.isFile) {
            //console.log(`Directory item`, entry);
            const fileEntry = entry as FileSystemFileEntry;
            const file = await readEntryContentAsync(fileEntry);
            //console.log(`Adding file [${file.name}] of type [${file.type}]`);
            files.push(file);
        } else {
            console.log(`Directory item is not a file`, entry);
        }
    }
    return files;
}

/**
 * Read all the entries in a directory
 */
const readAllDirectoryEntries = async (directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> => {
    const directoryReader = directory.createReader();

    // To read all files in a directory, readEntries needs to be called
    // repeatedly until it returns an empty array.  Chromium-based
    // browsers will only return a max of 100 entries per call
    const entries = [];
    let readEntries = await readEntriesPromise(directoryReader);
    while (readEntries.length > 0) {
        entries.push(...readEntries);
        readEntries = await readEntriesPromise(directoryReader);
    }
    return entries;
};

/**
 * Wrap FileSystemDirectoryReader.readEntries() in a promise to enable using await
 */
const readEntriesPromise = async (directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
    return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject);
    });
};

/**
 * Wrap FileSystemFileEntry.file() in a promise to enable using await
 */
const readEntryContentAsync = async (entry: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve, reject) => {
        entry.file(resolve, reject);
    });
};
