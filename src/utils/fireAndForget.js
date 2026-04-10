export function fireAndForget(fn) {
  Promise.resolve()
    .then(fn)
    .catch((err) => {
      console.error("fireAndForget error:", err);
    });
}