import React, { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverAnchor,
} from "@/components/ui/popover"
import { countries } from "@/constants/countries"



export function CountrySelect({ value, onChange, placeholder = "Select country..." }) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value || "")
    const [highlightedIndex, setHighlightedIndex] = useState(0)

    React.useEffect(() => {
        if (value) setInputValue(value);
    }, [value]);

    const handleSelect = (countryLabel) => {
        setInputValue(countryLabel)
        onChange(countryLabel)
        setOpen(false)
    }

    // Manual filtering
    const filteredCountries = countries.filter((country) =>
        country.label.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 50);

    const listRef = React.useRef(null);

    // Scroll to highlighted item whenever it changes
    React.useEffect(() => {
        if (open) {
            const element = document.getElementById(`country-item-${highlightedIndex}`);
            if (element) {
                element.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex, open]);

    React.useEffect(() => {
        if (!open) return;

        const handleGlobalKeyDown = (e) => {
            if (filteredCountries.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev + 1) % filteredCountries.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev - 1 + filteredCountries.length) % filteredCountries.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredCountries[highlightedIndex]) {
                    handleSelect(filteredCountries[highlightedIndex].label);
                }
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [open, filteredCountries, highlightedIndex]);

    const handleInputKeyDown = (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (!open) {
                setOpen(true);
                setHighlightedIndex(0);
                e.preventDefault();
            }
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverAnchor asChild>
                <div className="relative w-full">
                    <Input
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setOpen(true);
                            setHighlightedIndex(0); // Reset highlight on type
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleInputKeyDown}
                        className="bg-transparent"
                        autoComplete="off"
                    />
                    <ChevronsUpDown className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
            </PopoverAnchor>
            <PopoverContent
                className="w-[300px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div
                    ref={listRef}
                    className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 relative"
                >
                    {filteredCountries.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">No country found.</div>
                    ) : (
                        filteredCountries.map((country, index) => (
                            <div
                                key={country.value}
                                id={`country-item-${index}`}
                                onClick={() => handleSelect(country.label)}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    highlightedIndex === index ? "bg-indigo-600 text-white font-medium" : "",
                                    value === country.label ? "bg-accent/50" : ""
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === country.label ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {country.label}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
