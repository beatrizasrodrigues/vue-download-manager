const sizes = ["Bytes", "KB", "MB"];
export const useFileSizeFormatter = (bytes: number): string => {
  if (!bytes) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  return `${size} ${sizes[i]}`;
};
