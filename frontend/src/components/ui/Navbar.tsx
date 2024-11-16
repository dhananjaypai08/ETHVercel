import {Code, Github} from "lucide-react"

const Navbar = () =>{
    return (
        <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-8 h-8 text-purple-500" />
                <span className="text-xl font-bold">ZK based deployments</span>
              </div>
              
        </nav>
    )
}

export default Navbar;