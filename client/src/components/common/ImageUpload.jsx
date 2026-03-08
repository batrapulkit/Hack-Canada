import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ImageUpload({ onImageSelected, isLoading, label = "Upload Screenshot" }) {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const processFile = useCallback((file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
                onImageSelected(e.target.result); // Pass base64 back
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelected]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    const handleChange = useCallback((e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    }, [processFile]);

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelected(null);
    };

    return (
        <div className="w-full">
            <AnimatePresence mode='wait'>
                {!preview ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`relative w-full h-32 border-2 border-dashed rounded-lg transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer
              ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('image-upload-input').click()}
                    >
                        <input
                            id="image-upload-input"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleChange}
                        />
                        {isLoading ? (
                            <div className="flex flex-col items-center text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                                <span className="text-sm font-medium">Analyzing...</span>
                            </div>
                        ) : (
                            <>
                                <Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-primary' : 'text-slate-400'}`} />
                                <p className="text-sm text-slate-600 font-medium">
                                    {label}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Drag & drop or click to browse</p>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                    >
                        <img src={preview} alt="Preview" className="w-full h-full object-contain" />

                        {/* Overlay Loading State on top of image if re-processing or initially processing */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                                <span className="text-sm font-medium text-slate-700">Extracting details...</span>
                            </div>
                        )}

                        {!isLoading && (
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
