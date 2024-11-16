import { Code } from "lucide-react";
const Footer=() => {
    return (
    <footer className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Code className="w-6 h-6 text-purple-500" />
              <span className="font-semibold">DeployChain</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 DeployChain. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
}

export default Footer;