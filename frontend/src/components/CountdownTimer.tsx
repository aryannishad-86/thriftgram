import React, { useState, useEffect } from 'react';

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
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (
                newTimeLeft.days === 0 &&
                newTimeLeft.hours === 0 &&
                newTimeLeft.minutes === 0 &&
                newTimeLeft.seconds === 0
            ) {
                if (onComplete) onComplete();
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: React.ReactNode[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        const value = timeLeft[interval];
        if (value === undefined) return;

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center mx-2 md:mx-4">
                <span className="text-3xl md:text-6xl font-bold text-white font-mono">
                    {value.toString().padStart(2, '0')}
                </span>
                <span className="text-xs md:text-sm text-white/50 uppercase tracking-widest mt-2">
                    {interval}
                </span>
            </div>
        );
    });

    return (
        <div className="flex justify-center items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-10">
            {timerComponents.length ? timerComponents : <span className="text-2xl font-bold text-white">Event Started!</span>}
        </div>
    );
}
