import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Copy, Check, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import type { Id } from "../../../convex/_generated/dataModel";

interface OrgQRCodeProps {
  organizationId: Id<"organizations">;
  joinCode: string;
}

export function OrgQRCode({ organizationId, joinCode }: OrgQRCodeProps) {
  const regenerateCode = useMutation(api.organizations.regenerateJoinCode);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(joinCode, {
      width: 200,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrDataUrl);
  }, [joinCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateCode({ organizationId });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          alt="QR Code"
          className="h-48 w-48 rounded-lg"
        />
      )}

      <div className="flex items-center gap-3">
        <span className="font-mono text-3xl font-bold tracking-widest text-white">
          {joinCode}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-400" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Workers scan this QR code or enter the code to join
      </p>

      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-50"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
        />
        Regenerate Code
      </button>
    </div>
  );
}
