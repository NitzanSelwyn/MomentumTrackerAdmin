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
      color: { dark: "#00d4ff", light: "#00000000" },
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
    <div className="flex flex-col items-center gap-5">
      {qrDataUrl && (
        <div className="rounded-2xl border border-white/[0.06] bg-surface-3 p-4">
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="h-48 w-48"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="font-mono text-3xl font-bold tracking-[0.25em] text-white">
          {joinCode}
        </span>
        <button
          onClick={handleCopy}
          className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-accent transition-all duration-200"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-5 w-5 text-neon" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>

      <p className="text-sm text-white/30 font-body">
        Workers scan this QR code or enter the code to join
      </p>

      <button
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs text-white/40 hover:bg-white/[0.03] hover:text-white/60 disabled:opacity-40 font-body transition-all duration-200"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
        />
        Regenerate Code
      </button>
    </div>
  );
}
