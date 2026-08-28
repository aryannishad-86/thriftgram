'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import SearchAutocomplete from './SearchAutocomplete';

export default function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-full p-2 text-foreground transition-colors hover:bg-base-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                aria-label="Search"
            >
                <Search className="h-5 w-5" />
            </button>

            {/* Was a hand-rolled backdrop + panel with no escape handling, no
                scroll lock, no focus management and no dialog semantics — you
                could tab straight out of the open modal into the page behind
                it, and closing dumped focus back at the top of the document.
                The Dialog primitive supplies all of that. */}
            <Dialog
                open={isOpen}
                onClose={() => setIsOpen(false)}
                title="Search ThriftGram"
                variant="sheet"
                className="p-6"
            >
                <SearchAutocomplete />
            </Dialog>
        </>
    );
}
