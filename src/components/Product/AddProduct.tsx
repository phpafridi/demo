'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from "next/navigation";
import { fetchCurrency } from "../settings/actions/fetchCurrency";
import { toast } from "sonner";

type TierPriceKey = 'quantity_above' | 'selling_price_tier';
type ProductAttribute = 'attribute_name' | 'value';
type Category = { category_id: number; category_name: string; created_datetime: Date };
type Subcategory = { subcategory_id: string; subcategory_name: string };
type Tax = { tax_id: number; tax_title: string; tax_rate: number; tax_type: number };

export default function AddProduct() {
    const router = useRouter();
    const [Currency, setCurrency] = useState('Rs');

    const [loading, setLoading] = useState(false)        // saving product
    const [loadingData, setLoadingData] = useState(true) // fetching dropdowns
    const [isCheckingCode, setIsCheckingCode] = useState(false)
    const [codeError, setCodeError] = useState('')

    const initialForm = {
        product_code: '', product_name: '', product_note: '', category_id: '', subcategory_id: '1', tax_id: '', image: '', buying_price: '',
        selling_price: '', start_date: '', end_date: '', special_offer_price: '', product_quantity: '', notify_bellow_quantity: '',
        tag: '', measurement_units: '', packet_size: '',
        // ADDED: Expiration date fields
        expiration_date: '', has_expiration: false, days_before_expiry_alert: '30'
    };

    const [form, setForm] = useState(initialForm);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [image, setImage] = useState<File | null>(null);
    const [tierPrices, setTierPrices] = useState<{ quantity_above: string, selling_price_tier: string }[]>([]);
    const [productAttribute, setProductAttribute] = useState<{ attribute_name: string; value: string }[]>([]);

    // Function to check product code duplication
    const checkProductCode = useCallback(async (productCode: string): Promise<boolean> => {
        if (!productCode.trim()) return false
        
        try {
            const res = await fetch(`/api/check-product-code?code=${encodeURIComponent(productCode)}`)
            if (!res.ok) return false
            
            const data = await res.json()
            return data.exists || false
        } catch (err) {
            console.error('Error checking product code:', err)
            return false
        }
    }, [])

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);

                const [currencyData, taxRes, categoryRes] = await Promise.all([
                    fetchCurrency(),
                    fetch("/api/taxes"),
                    fetch("/api/categories")
                ]);

                if (currencyData?.currency) setCurrency(currencyData.currency);

                const taxJson = await taxRes.json();
                if (taxJson.success) setTaxes(taxJson.data);

                const catJson = await categoryRes.json();
                if (catJson.success) setCategories(catJson.data);
            } catch (err) {
                console.error("Failed to fetch form data", err);
                toast.error("Failed to load form data");
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    // Fetch subcategories when category changes
    

    // Real-time product code validation
    useEffect(() => {
        const validateProductCode = async () => {
            if (!form.product_code || form.product_code.trim().length < 1) {
                setCodeError('')
                return
            }
            
            setIsCheckingCode(true)
            try {
                const isDuplicate = await checkProductCode(form.product_code)
                if (isDuplicate) {
                    setCodeError(`❌ Product code "${form.product_code}" already exists!`)
                } else {
                    setCodeError('')
                }
            } catch (err) {
                console.error('Validation error:', err)
                setCodeError('Error checking product code')
            } finally {
                setIsCheckingCode(false)
            }
        }
        
        // Debounce the validation (wait 500ms after user stops typing)
        const timeoutId = setTimeout(validateProductCode, 500)
        return () => clearTimeout(timeoutId)
    }, [form.product_code, checkProductCode])

    // Handlers
    const handleChangeSelectCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === "category_id") setForm(prev => ({ ...prev, subcategory_id: "" }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm({ 
            ...form, 
            [name]: type === 'checkbox' ? checked : value 
        });
    }

    const handleChangeTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const handleChangeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
    };

    // Product Attributes
    const handleAddAttribute = () => setProductAttribute([...productAttribute, { attribute_name: '', value: '' }]);
    const handleAttributeChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.name as ProductAttribute;
        setProductAttribute(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: e.target.value };
            return updated;
        });
    };
    const handleRemoveAttribute = (index: number) => setProductAttribute(productAttribute.filter((_, i) => i !== index));

    // Tier Prices
    const handleAddTire = () => setTierPrices([...tierPrices, { quantity_above: '', selling_price_tier: '' }]);
    const handleTierChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.name as TierPriceKey;
        setTierPrices(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: e.target.value };
            return updated;
        });
    };
    const handleRemoveTire = (index: number) => setTierPrices(tierPrices.filter((_, i) => i !== index));

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate product code
        if (!form.product_code.trim()) {
            toast.error('Product code is required!')
            return
        }

        // Check for duplicate product code before submitting
        const isDuplicate = await checkProductCode(form.product_code)
        if (isDuplicate) {
            toast.error(`Cannot save: Product code "${form.product_code}" already exists!`)
            return
        }

        try {
            setLoading(true);

            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (key === 'has_expiration') {
                    formData.append(key, value ? 'true' : 'false');
                } else {
                    formData.append(key, value as string);
                }
            });
            if (image) formData.append("file", image);

            tierPrices.forEach((tier, i) => {
                formData.append(`tierPrices[${i}][quantity_above]`, tier.quantity_above);
                formData.append(`tierPrices[${i}][selling_price_tier]`, tier.selling_price_tier);
            });
            productAttribute.forEach((attr, i) => {
                formData.append(`productAttribute[${i}][attribute_name]`, attr.attribute_name);
                formData.append(`productAttribute[${i}][value]`, attr.value);
            });

            const res = await fetch('/api/add-product', { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                toast.success("Product added successfully!");
                setForm(initialForm);
                setImage(null);
                setTierPrices([]);
                setProductAttribute([]);
    
                setCodeError(''); // Clear any error messages
            } else {
                toast.error(data.error || "Failed to add product");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    // Loader for fetching data
    if (loadingData) {
        return (
            <section className="content text-center">
                <i className="fa fa-spinner fa-spin fa-2x" /> <p>Loading form data...</p>
            </section>
        )
    }

    return (
        <section className="content">
            <div className="row">
                <div className="col-md-12">
                    <div className="box box-primary">
                        <div className="box-header box-header-background with-border">
                            <h3 className="box-title">Add New Product</h3>
                        </div>

                        <form role="form" id="addProductForm" onSubmit={handleSubmit}>
                            <ul id="tabs" className="nav nav-tabs" data-tabs="tabs">
                                <li className="active"><a href="#general" data-toggle="tab">General</a></li>
                                <li><a href="#price" data-toggle="tab">Price</a></li>
                                <li><a href="#inventory" data-toggle="tab">Inventory</a></li>
                                <li><a href="#attribute" data-toggle="tab">Attribute & Tag</a></li>
                            </ul>

                            <div className="row">
                                <div className="col-md-6 col-sm-12 col-xs-12 col-md-offset-3">
                                    <div id="my-tab-content" className="tab-content">

                                        {/* GENERAL TAB */}
                                        <div className="tab-pane active" id="general">
                                            <div className="form-group">
                                                <label>Product Code *</label>
                                                <input 
                                                    type="text" 
                                                    name="product_code" 
                                                    value={form.product_code} 
                                                    onChange={handleChange} 
                                                    required 
                                                    className={`form-control ${codeError ? 'border-red-500' : ''}`}
                                                    placeholder="Enter unique product code"
                                                />
                                                
                                                {/* Validation messages */}
                                                {isCheckingCode && (
                                                    <small className="text-blue-500 flex items-center gap-1 mt-1">
                                                        <i className="fa fa-spinner fa-spin"></i> Checking availability...
                                                    </small>
                                                )}
                                                
                                                {codeError && (
                                                    <small className="text-red-500 flex items-center gap-1 mt-1">
                                                        <i className="fa fa-times"></i> {codeError}
                                                    </small>
                                                )}
                                                
                                                {!codeError && form.product_code.trim().length >= 1 && !isCheckingCode && (
                                                    <small className="text-green-500 flex items-center gap-1 mt-1">
                                                        <i className="fa fa-check"></i> Product code is available
                                                    </small>
                                                )}
                                            </div>
                                            <div className="form-group">
                                                <label>Product Name *</label>
                                                <input type="text" name="product_name" value={form.product_name} onChange={handleChange} required className="form-control" />
                                            </div>
                                            <div className="form-group">
                                                <label>Product Note</label>
                                                <textarea name="product_note" value={form.product_note} onChange={handleChangeTextArea} className="form-control" />
                                            </div>
                                            <div className="form-group">
                                                <label>Category</label>
                                                <select name="category_id" value={form.category_id} onChange={handleChangeSelectCategory} className="form-control" required>
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>)}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label>Tax *</label>
                                                <select name="tax_id" value={form.tax_id} onChange={handleChangeSelect} className="form-control" required>
                                                    <option value="">Select Tax</option>
                                                    {taxes.map(tax => (
                                                        <option key={tax.tax_id} value={tax.tax_id}>
                                                            {tax.tax_title} - {tax.tax_rate} {tax.tax_type === 1 ? 'Percentage (%)' : `Fixed (${Currency})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Product Image</label>
                                                <input type="file" accept="image/*" onChange={handleImage} />
                                            </div>
                                        </div>

                                        {/* PRICE TAB */}
                                        <div className="tab-pane" id="price">
                                            <div className="form-group">
                                                <label>Buying Price *</label>
                                                <div className="input-group">
                                                    <span className="input-group-addon">{Currency}</span>
                                                    <input type="number" step="0.01" name="buying_price" value={form.buying_price} onChange={handleChange} required className="form-control" />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Selling Price *</label>
                                                <div className="input-group">
                                                    <span className="input-group-addon">{Currency}</span>
                                                    <input type="number" step="0.01" name="selling_price" value={form.selling_price} onChange={handleChange} required className="form-control" />
                                                </div>
                                            </div>
                                            <h5>Special Offer</h5>
                                            <div className="form-group">
                                                <label>Start Date</label>
                                                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="form-control" />
                                            </div>
                                            <div className="form-group">
                                                <label>End Date</label>
                                                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="form-control" />
                                            </div>
                                            <div className="form-group">
                                                <label>Special Offer Price</label>
                                                <div className="input-group">
                                                    <span className="input-group-addon">{Currency}</span>
                                                    <input type="number" step="0.01" name="special_offer_price" value={form.special_offer_price} onChange={handleChange} className="form-control" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* INVENTORY TAB */}
                                        <div className="tab-pane" id="inventory">
                                            <div className="form-group">
                                                <label>Product Quantity</label>
                                                <input type="number" step="0.01" name="product_quantity" value={form.product_quantity} onChange={handleChange} className="form-control" />
                                            </div>
                                            <div className="form-group">
                                                <label>Notify Below Quantity</label>
                                                <input type="number" step="0.01" name="notify_bellow_quantity" value={form.notify_bellow_quantity} onChange={handleChange} className="form-control" />
                                            </div>
                                            
                                            <h5>Expiration Date Settings</h5>
                                            <div className="form-group">
                                                <div className="checkbox">
                                                    <label>
                                                        <input 
                                                            type="checkbox" 
                                                            name="has_expiration" 
                                                            checked={form.has_expiration} 
                                                            onChange={handleChange}
                                                        /> This product expires
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {form.has_expiration && (
                                                <>
                                                    <div className="form-group">
                                                        <label>Expiration Date</label>
                                                        <input 
                                                            type="date" 
                                                            name="expiration_date" 
                                                            value={form.expiration_date} 
                                                            onChange={handleChange} 
                                                            className="form-control" 
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Alert Before Expiry (Days)</label>
                                                        <input 
                                                            type="number" 
                                                            name="days_before_expiry_alert" 
                                                            value={form.days_before_expiry_alert} 
                                                            onChange={handleChange} 
                                                            className="form-control" 
                                                            min="1"
                                                            max="365"
                                                            placeholder="Default: 30 days"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div className="form-group">
                                                <label>Measurement Units</label>
                                                <select name="measurement_units" value={form.measurement_units} onChange={handleChangeSelect} className="form-control" required>
                                                    <option value="">Select Measurement Units</option>
                                                    <option value="item">Item</option>
                                                    <option value="pieces">Packet In Pieces</option>
                                                    <option value="kg">Kg</option>
                                                    <option value="g">Grams</option>
                                                    <option value="liters">Liters</option>
                                                </select>
                                            </div>

                                            {form.measurement_units === "pieces" && (
                                                <div className="form-group">
                                                    <label>How many pieces in one packet?</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="packet_size"
                                                        value={form.packet_size}
                                                        onChange={handleChange}
                                                        className="form-control"
                                                        placeholder="e.g. 7"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* ATTRIBUTE TAB */}
                                        <div className="tab-pane" id="attribute">
                                            <h5>Product Attributes</h5>
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Attribute</th>
                                                        <th>Value</th>
                                                        <th><button className="btn btn-info" onClick={e => { e.preventDefault(); handleAddAttribute(); }}>Add</button></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {productAttribute.map((attr, i) => (
                                                        <tr key={i}>
                                                            <td><input type="text" name="attribute_name" value={attr.attribute_name} onChange={e => handleAttributeChange(i, e)} className="form-control" /></td>
                                                            <td><input type="text" name="value" value={attr.value} onChange={e => handleAttributeChange(i, e)} className="form-control" /></td>
                                                            <td>{i === 0 ? null : <button className="btn btn-danger" onClick={e => { e.preventDefault(); handleRemoveAttribute(i); }}>Remove</button>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <h5>Product Tag</h5>
                                            <input type="text" name="tag" value={form.tag} onChange={handleChange} className="form-control" />
                                        </div>

                                    </div>
                                </div>
                            </div>

                            <div className="box-footer">
                                <button 
                                    type="submit" 
                                    className="btn bg-navy btn-flat col-md-offset-3" 
                                    disabled={loading || isCheckingCode || !!codeError}
                                >
                                    {loading ? <><i className="fa fa-spinner fa-spin" /> Saving...</> : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}