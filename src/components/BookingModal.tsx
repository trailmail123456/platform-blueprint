import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateICS, downloadICS } from "@/lib/icsGenerator";
import {
  CreditCard,
  Video,
  Calendar,
  FileText,
  CheckCircle2,
  Copy,
  Download,
} from "lucide-react";
import type { Mentor } from "@/lib/mockMentorData";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
}

export const BookingModal = ({
  open,
  onOpenChange,
  mentor,
  selectedDate,
  selectedTime,
}: BookingModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"payment" | "confirmed">("payment");
  const [cardNumber, setCardNumber] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [videoLink, setVideoLink] = useState("");

  const handlePayment = () => {
    // Simulate payment processing
    if (!cardNumber || cardNumber.length < 16) {
      toast({
        title: "Invalid Card",
        description: "Please enter a valid card number",
        variant: "destructive",
      });
      return;
    }

    // Generate video call link (simulated)
    const meetingId = Math.random().toString(36).substring(7);
    const generatedLink = `https://meet.platform.com/${meetingId}`;
    setVideoLink(generatedLink);

    setStep("confirmed");
    toast({
      title: "Booking Confirmed!",
      description: "Payment processed successfully. Check your email for details.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoLink);
    toast({
      title: "Copied!",
      description: "Video call link copied to clipboard",
    });
  };

  const handleDownloadCalendar = () => {
    if (!mentor || !selectedDate || !selectedTime) return;

    const [hours] = selectedTime.split(":");
    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(hours), 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const icsContent = generateICS({
      title: `Mentorship Session with ${mentor.name}`,
      description: `${mentor.title} at ${mentor.company}\\n\\nTopics: ${mentor.expertise.join(", ")}\\n\\n${sessionNotes || "1-on-1 mentorship session"}`,
      location: "Virtual Meeting",
      startTime,
      endTime,
      url: videoLink,
    });

    downloadICS(icsContent, `mentorship-${mentor.name.replace(/\s+/g, "-")}.ics`);

    toast({
      title: "Calendar Invite Downloaded",
      description: "Add this event to your calendar app",
    });
  };

  const handleClose = () => {
    setStep("payment");
    setCardNumber("");
    setSessionNotes("");
    setVideoLink("");
    onOpenChange(false);
  };

  if (!mentor) return null;

  const totalAmount = mentor.pricePerHour;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === "payment" ? "Complete Booking" : "Booking Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {step === "payment" ? (
          <div className="space-y-6 py-4">
            {/* Session Details */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold mb-3">Session Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mentor</span>
                  <span className="font-medium">{mentor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">1 hour</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Session Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any topics you'd like to discuss or questions you have..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(e.target.value.replace(/\s/g, ""))
                    }
                    maxLength={16}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" maxLength={3} type="password" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Secure payment processing with 256-bit encryption</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Success Message */}
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Booking Confirmed!</h3>
              <p className="text-sm text-muted-foreground">
                Your session with {mentor.name} has been scheduled
              </p>
            </div>

            {/* Video Call Link */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Video Call Link
              </Label>
              <div className="flex gap-2">
                <Input value={videoLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will be active 10 minutes before your session
              </p>
            </div>

            {/* Session Notes */}
            {sessionNotes && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Your Notes
                </Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{sessionNotes}</p>
                </div>
              </div>
            )}

            {/* Calendar Download */}
            <Button
              onClick={handleDownloadCalendar}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Add to Calendar (.ics)
            </Button>

            {/* Session Details */}
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">
                  {selectedDate?.toLocaleDateString()} at {selectedTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">1 hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium">₹{totalAmount}</span>
              </div>
            </div>

            <Badge variant="secondary" className="w-full justify-center py-2">
              <Calendar className="mr-2 h-3 w-3" />
              Confirmation email sent to your inbox
            </Badge>
          </div>
        )}

        <DialogFooter>
          {step === "payment" ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePayment} className="gap-2">
                <CreditCard className="h-4 w-4" />
                Pay ₹{totalAmount}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
