const TOKEN_TYPE = "application/x-alea-token";

export function startTokenDrag(dataTransfer: DataTransfer, tokenId: string) {
  dataTransfer.setData(TOKEN_TYPE, tokenId);
  dataTransfer.effectAllowed = "copy";
}

export function isTokenDrag(dataTransfer: DataTransfer) {
  return dataTransfer.types.includes(TOKEN_TYPE);
}

export function droppedTokenId(dataTransfer: DataTransfer) {
  return dataTransfer.getData(TOKEN_TYPE) || null;
}
