import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export function TypingAnimation({
  text,
  duration = 100,
  className,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [duration, i, text]);

  return (
    <span
      className={cn(
        "font-display font-bold tracking-[-0.02em]",
        className,
      )}
    >
      {displayedText ? displayedText : text}
    </span>
  );
}

export default TypingAnimation;
