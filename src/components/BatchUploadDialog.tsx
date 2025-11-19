import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "enhancing" | "complete" | "error";
  progress: number;
  error?: string;
  noteId?: string;
}

interface BatchUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BatchUploadDialog = ({ open, onOpenChange, onSuccess }: BatchUploadDialogProps) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter((f) => f.type === "application/pdf");
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files are allowed");
    }

    setFiles(
      pdfFiles.map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (item: UploadItem, index: number) => {
    if (!user) return;

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 30 } : f))
      );

      // Upload to storage
      const fileExt = "pdf";
      const fileName = `${user.id}/${Date.now()}-${item.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(fileName, item.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("notes")
        .getPublicUrl(fileName);

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 50 } : f))
      );

      // AI enhancement
      let enhancedUrl = publicUrl;
      if (enhanceWithAI) {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: "enhancing", progress: 60 } : f))
        );

        const { data: enhancedData, error: enhanceError } = await supabase.functions.invoke(
          "enhance-pdf",
          { body: { pdfUrl: publicUrl } }
        );

        if (!enhanceError && enhancedData?.enhancedUrl) {
          enhancedUrl = enhancedData.enhancedUrl;
        }
      }

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 80 } : f))
      );

      // Create note record
      const { data: noteData, error: insertError } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: item.file.name.replace(".pdf", ""),
          subject: subject || "General",
          branch: branch || null,
          semester: semester ? parseInt(semester) : null,
          content_url: enhancedUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "complete", progress: 100, noteId: noteData.id }
            : f
        )
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
    }
  };

  const handleBatchUpload = async () => {
    if (!user || files.length === 0) return;

    setUploading(true);

    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadFile(files[i], i);
      }
    }

    setUploading(false);
    toast.success(`Uploaded ${files.filter((f) => f.status === "complete").length} notes!`);
    onSuccess();
  };

  const allComplete = files.length > 0 && files.every((f) => f.status === "complete");
  const hasErrors = files.some((f) => f.status === "error");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Upload Notes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Physics"
                disabled={uploading}
              />
            </div>
            <div>
              <Label>Branch</Label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g., CSE"
                disabled={uploading}
              />
            </div>
            <div>
              <Label>Semester</Label>
              <Input
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g., 3"
                disabled={uploading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="batch-enhance"
              checked={enhanceWithAI}
              onCheckedChange={(checked) => setEnhanceWithAI(checked as boolean)}
              disabled={uploading}
            />
            <Label htmlFor="batch-enhance" className="cursor-pointer">
              Enhance all PDFs with AI
            </Label>
          </div>

          <div>
            <Label htmlFor="batch-files">Select PDF Files</Label>
            <Input
              id="batch-files"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFilesChange}
              disabled={uploading}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {files.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      {item.status === "complete" && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      {item.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      {(item.status === "uploading" || item.status === "enhancing") && (
                        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                      )}
                    </div>
                    <Progress value={item.progress} className="h-2" />
                    {item.status === "enhancing" && (
                      <p className="text-xs text-muted-foreground mt-1">Enhancing with AI...</p>
                    )}
                    {item.error && (
                      <p className="text-xs text-destructive mt-1">{item.error}</p>
                    )}
                  </div>
                  {item.status === "pending" && !uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (!uploading) {
                  onOpenChange(false);
                  setFiles([]);
                }
              }}
              disabled={uploading}
            >
              {allComplete ? "Close" : "Cancel"}
            </Button>
            {!allComplete && (
              <Button onClick={handleBatchUpload} disabled={uploading || files.length === 0}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length} {files.length === 1 ? "File" : "Files"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
