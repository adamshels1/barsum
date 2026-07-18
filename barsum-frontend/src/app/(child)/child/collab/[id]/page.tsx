"use client";

import { useParams } from "next/navigation";
import { CollabBookView } from "@/components/CollabBookView";

export default function ChildCollabBookPage() {
  const { id } = useParams<{ id: string }>();
  return <CollabBookView challengeId={id} role="child" />;
}
