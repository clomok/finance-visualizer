// A simple UUID generator that works in insecure contexts.
export const generateUUID = (): string => {
  // A basic implementation to create a reasonably unique ID.
  // Not as robust as crypto.randomUUID but sufficient for this client-side app.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
