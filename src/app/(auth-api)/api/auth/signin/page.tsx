'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  // const [email, setEmail] = useState("");
  // const [name, setName] = useState("");
  // const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const name = formData.get('name');

    const email = formData.get('email');
    const password = formData.get('password');


    const res = await fetch("/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Error creating user:", error);
      setError(error.message || "Failed to create user");
      return;
    }
     if (res.ok) router.push("/");
  };

  return (
    <div className="container" style={{ marginTop: '50px' }}>
      <div className="row">
        <div className="col-md-6 col-md-offset-3">


          <div className="box">
            <div className="box-header box-header-background with-border">
              <h3 className="box-title">Easy Inventory | Create User Login</h3>

            </div>
            <div className="box-body">

              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <div className="callout callout-success">
                <h3>Sparking!</h3>
                <h4>Easy Inventory Successfully Installed.</h4>
              </div>

              <h4>Create Login Details</h4>
              <hr />
              <form className="form-horizontal" id="install_form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="col-sm-4 control-label">Name</label>
                  <div className="col-sm-8">
                    <input className="form-control input_text" type="text" id="hostname" name="name" required />
                  </div>
                </div>


                <div className="form-group">
                  <label className="col-sm-4 control-label">Email</label>
                  <div className="col-sm-8">
                    <input className="form-control input_text" type="text" id="password" name="email" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="col-sm-4 control-label">Password</label>
                  <div className="col-sm-8">
                    <input className="form-control input_text" type="text" id="password" name="password" required />
                  </div>
                </div>




                <div className="form-group last">
                  <div className="col-sm-offset-4 col-sm-8">
                    <button type="submit" className="btn bg-navy btn-flat" id="submit">Create User</button>
                  </div>
                </div>
              </form>


            </div>
            <div className="box-footer">
              footer
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
