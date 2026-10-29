// src/pages/Register.jsx
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { registerUser } from "../api"

function Register() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loading, setLoading] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const navigate = useNavigate()

    async function handleRegister(e) {
        e.preventDefault() // Stops the page from refreshing when you hit Enter

        if(!name || !email || !password) {
            setError("please fill all fields")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("please enter a valid email address")
            return
        }

        if (password.length < 6) {
            setError("password must be at least 6 characters long")
            return
        }
        if (!/\d/.test(password)) {
            setError("password must contain at least one number")
            return
        }

        setLoading(true)
        setError("")

        const data = await registerUser(name, email, password)

        if(data.success) {
            setSuccess("registered successfully! redirecting to login...")
            setTimeout(() => navigate("/"), 2000)
        } else {
            setError(data.error || "registration failed")
        }

        setLoading(false)
    }

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Register</h2>

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}

                <form 
                    onSubmit={handleRegister}
                    onKeyDown={(e) => { if (e.key === 'Enter') setIsPressed(true) }}
                    onKeyUp={(e) => { if (e.key === 'Enter') setIsPressed(false) }}
                >
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <button 
                        type="submit" 
                        className={isPressed ? "pressed" : ""} 
                        disabled={loading}
                    >
                        {loading ? "registering..." : "Register"}
                    </button>
                </form>

                <p>
                    Have account? <Link to="/">Login here</Link>
                </p>
            </div>
        </div>
    )
}

export default Register