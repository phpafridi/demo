'use client';
import { useSession } from "next-auth/react";


export default function UserProfile() {
    const { data: session } = useSession();

    //   if (session) {
    //     console.log("User ID:", session?.user?.image);
    //   }

    return (
        <>
            <div className="user-panel">
                <div className="pull-left image">
                    {session && (
                        <img
                            src={`/api/uploads/${encodeURIComponent(session?.user?.image ?? 'default.jpg')}`}
                            alt="User Image"
                            className="img-circle"
                        />

                    )}
                </div>
                <div className="pull-left info" style={{ paddingTop: '15px' }}>
                    <p>{session?.user?.name}</p>
                </div>
            </div>
        </>
    )
}
