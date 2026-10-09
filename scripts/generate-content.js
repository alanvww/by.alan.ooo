#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFile } = require('child_process');

// Keep in sync with slugify() in src/lib/mdx.ts
function slugify(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/['’"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ensure the content directories exist
const contentDir = path.join(process.cwd(), 'src', 'content');
const postsDir = path.join(contentDir, 'posts');
const projectsDir = path.join(contentDir, 'projects');

// Create directories if they don't exist
[contentDir, postsDir, projectsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Ask what type of content to create
rl.question('What do you want to create? (post/project): ', (type) => {
    if (type.toLowerCase() !== 'post' && type.toLowerCase() !== 'project') {
        console.log('Invalid option. Please choose either "post" or "project".');
        rl.close();
        return;
    }

    // Get the title
    rl.question('Enter the title: ', (title) => {
        // Generate slug from title
        const slug = slugify(title);

        // Get excerpt
        rl.question('Enter a brief excerpt: ', (excerpt) => {
            // Generate the current date in YYYY-MM-DD format
            const today = new Date();
            const date = today.toISOString().split('T')[0];

            // Prepare the frontmatter (JSON.stringify escapes quotes/backslashes
            // so a title like My "Best" Project can't corrupt the YAML)
            let frontmatter = `---
title: ${JSON.stringify(title)}
date: "${date}"
excerpt: ${JSON.stringify(excerpt)}
coverImage: "./cover.jpg"
`;

            // Add additional fields for projects
            if (type.toLowerCase() === 'project') {
                rl.question('Enter project URL (optional): ', (projectUrl) => {
                    if (projectUrl) {
                        frontmatter += `projectUrl: ${JSON.stringify(projectUrl)}\n`;
                    }

                    rl.question('Enter technologies (comma-separated): ', (technologies) => {
                        const techArray = technologies.split(',')
                            .map(tech => tech.trim())
                            .filter(tech => tech);

                        if (techArray.length > 0) {
                            frontmatter += `technologies: [${techArray.map(t => JSON.stringify(t)).join(', ')}]\n`;
                        }

                        finishCreation();
                    });
                });
            } else {
                finishCreation();
            }

            function finishCreation() {
                // Close the frontmatter (XMBPostViewer already renders the H1 from frontmatter.title)
                frontmatter += `---

Write your content here...
`;

                // Determine the target directory
                const targetDir = type.toLowerCase() === 'post' ? postsDir : projectsDir;
                const folderPath = path.join(targetDir, slug);
                const filePath = path.join(folderPath, 'index.mdx');

                if (!slug) {
                    console.error('Title produced an empty slug — aborting.');
                    rl.close();
                    return;
                }

                // Never overwrite existing writing (flat file or folder variant)
                const existing = [filePath, path.join(folderPath, 'index.md'), `${folderPath}.mdx`, `${folderPath}.md`]
                    .find((candidate) => fs.existsSync(candidate));
                if (existing) {
                    console.error(`Refusing to overwrite existing content: ${existing}`);
                    rl.close();
                    return;
                }

                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }

                // Write the file
                fs.writeFileSync(filePath, frontmatter);
                console.log(`Created ${type} at: ${filePath}`);

                // Create a simple symbolic image file if needed
                console.log(`Remember to add images next to index.mdx (e.g. ${folderPath}/cover.jpg).`);
                console.log(`You can now edit the file at ${filePath}`);

                // Ask if they want to open the file
                rl.question('Do you want to open the file now? (y/n): ', (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        // Try to open with VS Code first, fallback to the default system editor
                        execFile('code', [filePath], (error) => {
                            if (error) {
                                execFile('open', [filePath]);
                            }
                        });
                    }

                    rl.close();
                });
            }
        });
    });
});
