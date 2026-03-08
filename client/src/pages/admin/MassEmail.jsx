import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import api from '../../api/client';

// Default Templates
const TEMPLATES = [
    {
        id: 'blank',
        name: 'Blank Template',
        subject: '',
        content: ''
    },
    {
        id: 'welcome',
        name: 'Welcome to Triponic',
        subject: 'Welcome to Triponic B2B!',
        content: `
            <h2>Welcome to Triponic!</h2>
            <p>We are thrilled to have you on board. Our platform is designed to help you scale your travel business with ease.</p>
            <p>Here are a few things you can do to get started:</p>
            <ul>
                <li>Complete your agency profile</li>
                <li>Browse our exclusive deals</li>
                <li>Reach out to our support team for any assistance</li>
            </ul>
            <p>Let's grow together!</p>
        `
    },
    {
        id: 'newsletter',
        name: 'Monthly Newsletter',
        subject: 'Triponic B2B - This Month\'s Highlights',
        content: `
            <h2>Monthly Highlights</h2>
            <p>Dear Partners,</p>
            <p>Here is what's happening at Triponic this month:</p>
            <h3>🌟 New Features</h3>
            <p>We've updated our dashboard to give you better insights into your booking trends.</p>
            <h3>🔥 Hot Deals</h3>
            <p>Check out our latest exclusive resort packages in the Maldives and Bali.</p>
            <p>Stay tuned for more updates!</p>
        `
    },
    {
        id: 'offer',
        name: 'Limited Time Offer',
        subject: 'Exclusive Limited Time Offer!',
        content: `
            <h2 style="color: #e11d48;">Limited Time Deal!</h2>
            <p>Act fast! For the next 48 hours, we are offering special rates on all European tour packages.</p>
            <button style="background-color: #000; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">View Deals</button>
            <p>Don't miss out on this opportunity to boost your sales.</p>
        `
    }
];

export default function MassEmail() {
    const [recipientList, setRecipientList] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('blank');

    // SMTP Configuration State
    const [smtpConfig, setSmtpConfig] = useState({
        host: 'smtp.hostinger.com',
        port: '465',
        user: '',
        pass: '',
        fromName: 'Triponic B2B'
    });

    // Fetch saved settings on mount
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/system-settings?keys=smtp_config');
                if (res.data.success && res.data.settings?.smtp_config) {
                    setSmtpConfig(res.data.settings.smtp_config);
                }
            } catch (err) {
                console.error("Failed to fetch SMTP settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleTemplateChange = (e) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);

        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            if (template.id !== 'blank') { // Don't wipe if switching to blank manually unless intended, but simple behavior is fine
                setSubject(template.subject);
                setContent(template.content);
            }
        }
    };

    const handleSmtpChange = (e) => {
        const { name, value } = e.target;
        setSmtpConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSend = async () => {
        if (!recipientList.trim() || !subject.trim() || !content.trim()) {
            toast.error("Please fill in recipient list, subject, and content.");
            return;
        }

        if (!smtpConfig.user || !smtpConfig.pass) {
            toast.error("Please provide SMTP Username and Password.");
            return;
        }

        // Split by newline to handle "Name <email>" format correctly
        // Then parse each line
        const parsedRecipients = recipientList
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Try to match "Name <email>"
                const nameEmailMatch = line.match(/^([^<]+)<([^>]+)>$/);
                if (nameEmailMatch) {
                    return {
                        name: nameEmailMatch[1].trim(),
                        email: nameEmailMatch[2].trim()
                    };
                }

                // Try to match "email"
                if (line.includes('@')) {
                    return {
                        name: '', // Default to empty or "Partner" in backend if needed
                        email: line.trim()
                    };
                }

                return null;
            })
            .filter(r => r && r.email.includes('@')); // Basic validation

        if (parsedRecipients.length === 0) {
            toast.error("No valid email addresses found. Use format: Name <email> or just email.");
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const response = await api.post('/admin/mass-email', {
                recipients: parsedRecipients,
                subject,
                content,
                smtpConfig
            });

            const data = response.data;

            if (data.success) {
                if (data.details.failed > 0 && data.details.errors?.length > 0) {
                    // Show first error or summary
                    const errorMsg = data.details.errors[0];
                    toast.warning(`Partial success: ${data.details.successful} sent. Failure reason: ${errorMsg}`);
                } else {
                    toast.success(`Emails Sent! ${data.details.successful} sent, ${data.details.failed} failed.`);
                }
                setResult(data.details);
                // Clear form on success? Maybe keep for reference.
            } else {
                throw new Error(data.error || 'Failed to send emails');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || error.message || "An error occurred while sending emails.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Mass Email</h1>
                <p className="text-slate-500">Send branded emails to multiple recipients at once.</p>
            </div>

            <div className="grid gap-6">
                {/* SMTP Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>SMTP Configuration</CardTitle>
                        <CardDescription>
                            Configure the email server settings for sending these emails.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">SMTP Host</Label>
                                <Input
                                    id="host"
                                    name="host"
                                    placeholder="smtp.example.com"
                                    value={smtpConfig.host}
                                    onChange={handleSmtpChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    name="port"
                                    placeholder="465"
                                    value={smtpConfig.port}
                                    onChange={handleSmtpChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="user">SMTP Username (Email)</Label>
                                <Input
                                    id="user"
                                    name="user"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={smtpConfig.user}
                                    onChange={handleSmtpChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pass">SMTP Password</Label>
                                <Input
                                    id="pass"
                                    name="pass"
                                    type="password"
                                    placeholder="••••••••"
                                    value={smtpConfig.pass}
                                    onChange={handleSmtpChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fromName">Sender Name</Label>
                            <Input
                                id="fromName"
                                name="fromName"
                                placeholder="Your Company Name"
                                value={smtpConfig.fromName}
                                onChange={handleSmtpChange}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Email Content Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>
                            Your email will be wrapped in the standard Triponic template with the company logo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template">Load Template</Label>
                            <select
                                id="template"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            >
                                {TEMPLATES.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recipients">Recipients (Emails)</Label>
                            <Textarea
                                id="recipients"
                                placeholder="John Doe <john@example.com>&#10;Jane Smith <jane@test.org>&#10;simple@email.com"
                                className="min-h-[100px] font-mono text-sm"
                                value={recipientList}
                                onChange={(e) => setRecipientList(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                                Enter one recipient per line. Format: <b>Name &lt;email&gt;</b> or just <b>email</b>.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="Summer Deals Announcement..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Message Content (HTML Supported)</Label>
                            <Textarea
                                id="content"
                                placeholder="<p>Hello everyone,</p><p>We have exciting news...</p>"
                                className="min-h-[200px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                                You can write plain text or basic HTML tags for formatting.
                            </p>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-4">
                            {result && (
                                <div className="text-sm mr-auto flex items-center gap-2 text-slate-600">
                                    {result.failed > 0 ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                    <span>Last Run: {result.successful} Sent, {result.failed} Failed</span>
                                </div>
                            )}

                            <Button onClick={handleSend} disabled={sending} className="min-w-[150px]">
                                {sending ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span> Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" /> Send Broadcast
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
