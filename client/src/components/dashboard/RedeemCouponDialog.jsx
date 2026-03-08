import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import api from '@/api/client';

export default function RedeemCouponDialog({ open, onClose, onSuccess }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRedeem = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/coupons/redeem', { code });
            if (res.data.success) {
                toast.success(res.data.message);
                onSuccess && onSuccess(res.data.new_credits);
                onClose();
                setCode('');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || "Failed to redeem code";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-indigo-600" />
                        Redeem Coupon
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRedeem} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Enter Coupon Code</Label>
                        <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g. WELCOME10"
                            className="uppercase"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading || !code.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Redeem Credits
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
