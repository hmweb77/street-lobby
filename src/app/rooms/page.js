import { Suspense } from "react";
import dynamic from "next/dynamic";
import { RoomCardSkeleton } from "@/components/RoomList";

// Dynamically import RoomList with Suspense support
const RoomList = dynamic(() => import("@/components/RoomList"), {
  suspense: true,
});

const Page = () => {
  return (
    <div>
      <Suspense fallback={<RoomCardSkeleton />}>
        <RoomList />
      </Suspense>
    </div>
  );
};

export default Page;
