import { useState } from "react";
import GridButtonGroup from "./components/GridButtonGroup";
import LookUp from "./components/LookUp";
import { useNavigate } from "react-router-dom";


const Home: React.FC = () => {
  const [publicId, setPublicId] = useState("");
  const navigate = useNavigate();

  const normalize = (publicId: string) => {
    console.log(publicId.trim().length);
    return publicId.trim().length === 60 ? publicId.toUpperCase().replace(/^0x/, "").trim() : "";
  };

    const handleLookup = (publicId: string) => {
      const normalizedPublicId = normalize(publicId);
      if (normalizedPublicId) {
        navigate(`/entity/${normalizedPublicId}`);
      }
    };

  return (
    <main className="relative isolate flex min-h-[calc(100vh-140px)] w-full justify-center overflow-hidden bg-background px-4 py-14 text-foreground sm:px-6 md:py-16 lg:px-8">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-12 text-center md:gap-16">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.6em] text-primary/70">Qdoge - Kennel Club</p>
          <h1 className="font-space text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Dashboard</h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
          A comprehensive Qubic ecosystem dashboard for QDOGE token holders. Connect your wallet to track orderbook trades, Qswap transactions, and transfers across epochs. Compete for top-100 weekly and monthly airdrops based on buy volume, manage QX assets, and monitor real-time activity in the QDOGE community.
          </p>
        </header>

        <section className="w-full space-y-10">
          <GridButtonGroup></GridButtonGroup>
          <LookUp entity={publicId} setEntity={setPublicId} handleLookup={handleLookup}></LookUp>
        </section>
      </div>
    </main>
  );
};

export default Home;
