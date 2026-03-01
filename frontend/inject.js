const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Page.jsx') && !['LandingPage.jsx', 'ProjectInputPage.jsx', 'AboutPage.jsx'].includes(f));

for (const f of files) {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    // 1. Ensure Import
    if (!content.includes('import BackButton')) {
        const lines = content.split('\n');
        lines.splice(1, 0, "import BackButton from '../components/ui/BackButton'");
        content = lines.join('\n');
    }

    // 2. Inject back button if not already present
    if (!content.includes('<BackButton')) {
        const returnIdx = content.indexOf('return (');
        if (returnIdx !== -1) {
            let afterReturn = content.substring(returnIdx);
            // Look for the first major wrapper div inside the component
            // Match either <div className="container"... or a top-level styling div
            // We will insert the BackButton just inside the first <div> we find that has padding or a container class.

            let injected = false;

            // Try container first
            let containerMatch = afterReturn.match(/(<div [^>]*className=["'][^"']*container[^"']*["'][^>]*>)/);
            if (containerMatch) {
                afterReturn = afterReturn.replace(containerMatch[0], containerMatch[0] + '\n                <BackButton to="/dashboard" />');
                injected = true;
            }
            // Fallback to top-level padded div
            else {
                let divMatch = afterReturn.match(/(<div [^>]*>)/);
                if (divMatch) {
                    // To avoid breaking page structure, just plug it right after the first div opening
                    afterReturn = afterReturn.replace(divMatch[0], divMatch[0] + '\n                <BackButton to="/dashboard" />');
                    injected = true;
                }
            }

            if (injected) {
                content = content.substring(0, returnIdx) + afterReturn;
                fs.writeFileSync(p, content);
                console.log("Injected BackButton to", f);
            } else {
                console.log("Failed to find insertion point for", f);
            }
        }
    } else {
        console.log("Already has BackButton:", f);
    }
}
console.log("Done.");
