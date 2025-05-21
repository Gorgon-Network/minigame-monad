"use client";

import {FarcasterActions} from "@/components/Home/FarcasterActions";
import {User} from "@/components/Home/User";
import {WalletActions} from "@/components/Home/WalletActions";
import UnityGame from "@/components/Home/UnityGame";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
            <h2 className="text-3xl font-bold text-center">
                Monad Archer
            </h2>
            <div className="w-full max-w-4xl space-y-6">
                {/*<User/>*/}
                <WalletActions/>
                <UnityGame/>
                <FarcasterActions/>
            </div>
        </div>
    );
}
