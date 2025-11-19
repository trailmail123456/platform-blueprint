import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";

interface NotePreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: {
    id: string;
    title: string;
    content_url: string;
    subject: string;
  } | null;
}

export const NotePreviewer = ({ open, onOpenChange, note }: NotePreviewerProps) => {
  const [loading, setLoading] = useState(true);

  if (!note) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(note.content_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{note.subject}</p>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={() => window.open(note.content_url, "_blank")}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden relative bg-muted">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <iframe
            src={`${note.content_url}#toolbar=0`}
            className="w-full h-full"
            title={note.title}
            onLoad={() => setLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
