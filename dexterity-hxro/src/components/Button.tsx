// components/Button.tsx
import { useState, useEffect } from "react";

interface ButtonProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
  status?: "success" | "failed";
}

const Button: React.FC<ButtonProps> = ({
  text,
  disabled,
  onClick,
  className,
  isLoading,
  status,
}) => {
  const [tempStatus, setTempStatus] = useState<"success" | "failed" | null>(
    null,
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "success" || status === "failed") {
      setTempStatus(status);
      timer = setTimeout(() => {
        setTempStatus(null);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  const displayText = tempStatus
    ? tempStatus === "success"
      ? "Success!"
      : "Failed!"
    : isLoading
      ? "Processing..."
      : text;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-md btn group m-2 w-60 ${className} ${disabled ? "cursor-not-allowed bg-gray-300" : ""}`}
    >
      {displayText}
    </button>
  );
};

export default Button;
