'use client';
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // ✅ import toast
import { getCompanyName } from '../../components/OrderProcess/actions/FetchCompanyDetails'

export default function Home() {
    const [error, setError] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const getName = async () => {
            const name = await getCompanyName();
            if (name) setCompanyName(name);
        }
        getName();
    }, [])

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.target as HTMLFormElement);
        const email = formData.get('email');
        const password = formData.get('password');

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            setError(res.error);
            toast.error(res.error); // ✅ error toast
            setLoading(false);
        } else {
            toast.success("Login successful 🎉"); // ✅ success toast
            router.push("/dashboard");
        }
    };

    return (
        <div className="">
            {error && (
                <div className="alert alert-danger text-center"> {error} </div>
            )}

            <div className="login-box">
                <div className="login-logo animated fadeInDown" data-animation="fadeInDown">
                    <a href="#"><b>{companyName}</b></a>
                </div>
                <div className="login-box-body  animated fadeInUp" data-animation="fadeInUp">
                    <form onSubmit={handleLogin}>
                        <div className="form-group has-feedback">
                            <input type="text" name="email" className="form-control" placeholder="Email" required />
                            <span className="glyphicon glyphicon-envelope form-control-feedback"></span>
                        </div>
                        <div className="form-group has-feedback">
                            <input type="password" name="password" className="form-control" placeholder="Password" required />
                            <span className="glyphicon glyphicon-lock form-control-feedback"></span>
                        </div>
                        <div className="form-group has-feedback">
                            <button 
                                type="submit" 
                                className="btn bg-orange btn-block btn-flat" 
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Login"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
