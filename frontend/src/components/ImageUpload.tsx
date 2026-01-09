'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
    onChange: (files: File[]) => void;
}

export default function ImageUpload({ onChange }: ImageUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const allFiles = [...files, ...newFiles];
            setFiles(allFiles);
            onChange(allFiles);

            const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
            setPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const handleRemove = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onChange(newFiles);

        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-base-03/30 bg-base-2 p-10 transition-all hover:border-base-03 hover:bg-base-2/80 cursor-pointer"
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
                <div className="rounded-full bg-base-03/10 p-4 text-base-03 mb-4">
                    <Upload className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-base-03">
                    Click to upload or drag and drop
                </p>
                <p className="text-xs text-base-02 mt-2">
                    SVG, PNG, JPG or GIF (max. 800x400px)
                </p>
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border bg-base-2">
                            <Image
                                src={preview}
                                alt={`Preview ${index}`}
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(index);
                                }}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm transition-colors hover:bg-red-500"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
