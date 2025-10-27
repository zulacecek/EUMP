declare module '*?worker' {
  export const ParadoxWorker: {
    new (): Worker;
  };

  export default ParadoxWorker;
}