import { openDB, DBSchema } from 'idb';
import { FileRecord } from '../types';

interface FinanceDB extends DBSchema {
  files: {
    key: string;
    value: FileRecord;
  };
}

const dbPromise = openDB<FinanceDB>('finance-visualizer-db', 1, {
  upgrade(db) {
    db.createObjectStore('files', { keyPath: 'id' });
  },
});

export const saveFile = async (record: FileRecord) => {
  return (await dbPromise).put('files', record);
};

export const getAllFiles = async () => {
  return (await dbPromise).getAll('files');
};

export const deleteFile = async (id: string) => {
  return (await dbPromise).delete('files', id);
};

export const clearAllFiles = async () => {
  return (await dbPromise).clear('files');
};