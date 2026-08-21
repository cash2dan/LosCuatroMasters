import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/* =========================================================
   UPPDATERINGSNOTIS

   Service workern körs i "prompt"-läge: en ny version laddas hem och
   lägger sig som waiting, men tar inte över förrän användaren säger
   till. Det gör att appen aldrig laddar om mitt i en scoreinmatning.

   Knappen i bannern skickar SKIP_WAITING och laddar om direkt —
   updateSW(true) sköter båda delarna.
   ========================================================= */

export function usePwaUpdate() {
  const [ready, setReady] = useState(false);
  const updateRef = useRef(null);

  useEffect(() => {
    updateRef.current = registerSW({
      onNeedRefresh() { setReady(true); },
      onRegisterError(err) {
        if (import.meta.env.DEV) console.warn("[pwa] kunde inte registrera service worker", err);
      },
    });
  }, []);

  /* updateSW(true) laddar om sidan själv — men bara när fliken redan var
     kontrollerad av den gamla service workern. Vi laddar därför om för
     hand när bytet är klart, med en fallback om det aldrig kommer. */
  const update = useCallback(() => {
    setReady(false);

    const reload = () => window.location.reload();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    }
    setTimeout(reload, 2500);

    updateRef.current?.(true);
  }, []);

  /* Avfärdad banner kommer tillbaka nästa gång appen startas — den nya
     versionen ligger kvar och väntar tills den släpps fram. */
  const dismiss = useCallback(() => setReady(false), []);

  return { ready, update, dismiss };
}
