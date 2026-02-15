#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

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
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');

        // Get excerpt
        rl.question('Enter a brief excerpt: ', (excerpt) => {
            // Generate the current date in YYYY-MM-DD format
            const today = new Date();
            const date = today.toISOString().split('T')[0];

            // Prepare the frontmatter
            let frontmatter = `---
title: "${title}"
date: "${date}"
excerpt: "${excerpt}"
coverImage: "./cover.jpg"
`;

            // Add additional fields for projects
            if (type.toLowerCase() === 'project') {
                rl.question('Enter project URL (optional): ', (projectUrl) => {
                    if (projectUrl) {
                        frontmatter += `projectUrl: "${projectUrl}"\n`;
                    }

                    rl.question('Enter technologies (comma-separated): ', (technologies) => {
                        const techArray = technologies.split(',')
                            .map(tech => tech.trim())
                            .filter(tech => tech);

                        if (techArray.length > 0) {
                            frontmatter += `technologies: [${techArray.map(t => `"${t}"`).join(', ')}]\n`;
                        }

                        finishCreation();
                    });
                });
            } else {
                finishCreation();
            }

            function finishCreation() {
                // Close the frontmatter
                frontmatter += `---

# ${title}

Write your content here...
`;

                // Determine the target directory
                const targetDir = type.toLowerCase() === 'post' ? postsDir : projectsDir;
                const folderPath = path.join(targetDir, slug);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: true });
                }
                const filePath = path.join(folderPath, 'index.mdx');

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
                        exec(`code ${filePath}`, (error) => {
                            if (error) {
                                exec(`open ${filePath}`);
                            }
                        });
                    }

                    rl.close();
                });
            }
        });
    });
});
