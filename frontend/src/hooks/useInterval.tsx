import { useEffect, useRef } from "react";

type Callback = () => void;

function useInterval(callback: Callback, delay: number) {
  const savedCallback = useRef<Callback | undefined>();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    const id = setInterval(tick, delay);

    return () => clearInterval(id);
  }, [delay]);
}

export default useInterval;
