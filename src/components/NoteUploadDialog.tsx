import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface NoteUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const NoteUploadDialog = ({ open, onOpenChange, onSuccess }: NoteUploadDialogProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [tags, setTags] = useState("");
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(".pdf", ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !file) {
      toast.error("Please sign in and select a file");
      return;
    }

    if (!title || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = "pdf";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("notes")
        .getPublicUrl(fileName);

      // If AI enhancement is enabled, process the PDF
      let enhancedUrl = publicUrl;
      if (enhanceWithAI) {
        toast.info("Enhancing PDF with AI...");
        const { data: enhancedData, error: enhanceError } = await supabase.functions.invoke(
          "enhance-pdf",
          {
            body: { pdfUrl: publicUrl },
          }
        );

        if (enhanceError) {
          console.error("Enhancement error:", enhanceError);
          toast.error("PDF uploaded but enhancement failed. Using original.");
        } else if (enhancedData?.enhancedUrl) {
          enhancedUrl = enhancedData.enhancedUrl;
          toast.success("PDF enhanced successfully!");
        }
      }

      // Insert note record
      const { error: insertError } = await supabase.from("notes").insert({
        user_id: user.id,
        title,
        subject,
        description,
        branch: branch || null,
        semester: semester ? parseInt(semester) : null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        content_url: enhancedUrl,
      });

      if (insertError) throw insertError;

      toast.success("Note uploaded successfully!");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFile(null);
      setTitle("");
      setSubject("");
      setDescription("");
      setBranch("");
      setSemester("");
      setTags("");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload note");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">PDF File *</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enhance"
              checked={enhanceWithAI}
              onCheckedChange={(checked) => setEnhanceWithAI(checked as boolean)}
              disabled={uploading}
            />
            <Label htmlFor="enhance" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4" />
              Enhance with AI (clean shadows, straighten, enhance contrast, OCR)
            </Label>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Data Structures Lecture 5"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Computer Science"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the notes"
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={branch} onValueChange={setBranch} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSE">Computer Science</SelectItem>
                  <SelectItem value="ECE">Electronics</SelectItem>
                  <SelectItem value="ME">Mechanical</SelectItem>
                  <SelectItem value="CE">Civil</SelectItem>
                  <SelectItem value="EE">Electrical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., algorithms, sorting, trees"
              disabled={uploading}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
