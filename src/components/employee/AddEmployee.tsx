'use client'

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { navigationMenus } from "./constants/navigationMenus";
import { toast } from "sonner";

type NavItem = {
  title: string;
  path?: string;
  children?: NavItem[];
};

export default function AddEmployee() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    user_type: "0",
  });

  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Recursively collect all paths of a menu and its children
  const collectPaths = (menu: NavItem): string[] => {
    let paths: string[] = [];
    if (menu.path) paths.push(menu.path);
    if (menu.children) menu.children.forEach(child => paths.push(...collectPaths(child)));
    return paths;
  };

  // Toggle parent + children selection
  const handleCheckboxChange = (menu: NavItem, checked: boolean) => {
    const parentPath = menu.path || menu.title;
    const allPaths = [parentPath, ...collectPaths(menu)];

    setSelectedMenus(prev =>
      checked
        ? [...new Set([...prev, ...allPaths])]
        : prev.filter(p => !allPaths.includes(p))
    );
  };

  // Form input handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("user_type", form.user_type);
    if (image) formData.append("file", image);
    formData.append("menus", JSON.stringify(selectedMenus));

    try {
      const res = await fetch("/api/create-user", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Employee created successfully!");
        router.push("/dashboard/employee/employee-list/");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Recursive render of menu tree
  const renderMenus = (menus: NavItem[], level = 0) => {
    return menus.map(menu => {
      const key = menu.path || menu.title;
      const checked = selectedMenus.includes(key);

      return (
        <div key={key} style={{ marginLeft: level * 20, marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleCheckboxChange(menu, e.target.checked)}
          />
          <label style={{ marginLeft: 5 }}>{menu.title}</label>
          {menu.children && checked && renderMenus(menu.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="right-side" style={{ minHeight: 945 }}>
      <section className="content-header">
        <ol className="breadcrumb">
          <li><a href="#">Add Employee</a></li>
          <li><a href="#">Employee Management</a></li>
        </ol>
      </section>

      <div className="container-fluid">
        <section className="content">
          <div className="row">
            <div className="col-md-12">
              <div className="box box-primary">
                <div className="box-header box-header-background with-border">
                  <h3 className="box-title">Create User</h3>
                </div>

                <form role="form" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 border-right">
                      <div className="box-body">
                        <div className="form-group">
                          <label>Name *</label>
                          <input type="text" name="name" value={form.name} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                          <label>Email *</label>
                          <input type="email" name="email" value={form.email} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                          <label>Password *</label>
                          <input type="password" name="password" value={form.password} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                          <label>User Type</label>
                          <select name="user_type" value={form.user_type} onChange={handleChangeSelect} className="form-control">
                            <option value="0">User</option>
                            <option value="1">Admin</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Employee Image</label>
                          <input type="file" accept="image/*" onChange={handleImage} />
                        </div>
                      </div>
                    </div>

                    {form.user_type === "0" && (
                      <div className="col-md-5 col-md-offset-1">
                        <div className="box-body">
                          <h4>User Access Role:</h4>
                          {renderMenus(navigationMenus)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="box-footer">
                    <button type="submit" className="btn bg-navy btn-flat" disabled={loading}>
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
