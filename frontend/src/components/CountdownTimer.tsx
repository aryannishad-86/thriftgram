import React, { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    onComplete?: () => void;
}

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    [key: string]: number | undefined;
}

export default function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    function calculateTimeLeft(): TimeLeft {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: TimeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (
                newTimeLeft.days === 0 &&
                newTimeLeft.hours === 0 &&
                newTimeLeft.minutes === 0 &&
                newTimeLeft.seconds === 0
            ) {
                onCompleteRef.current?.();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetDate]);

    const timerComponents: React.ReactNode[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        const value = timeLeft[interval];
        if (value === undefined) return;

        // Solid ink "flip clock" chips — a deliberate dark accent, not a
        // glass-on-light leftover: these are opaque fills, not translucent.
        timerComponents.push(
            <div key={interval} className="mx-2 flex flex-col items-center md:mx-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink md:h-24 md:w-24">
                    <span className="font-mono text-2xl font-bold text-white md:text-4xl">
                        {value.toString().padStart(2, '0')}
                    </span>
                </div>
                <span className="mt-3 text-xs uppercase tracking-widest text-muted md:text-sm">
                    {interval}
                </span>
            </div>
        );
    });

    return (
        <div className="flex items-center justify-center rounded-3xl border border-border bg-card p-6 md:p-10">
            {timerComponents.length ? timerComponents : <span className="text-2xl font-bold text-foreground">Event Started!</span>}
        </div>
    );
}
