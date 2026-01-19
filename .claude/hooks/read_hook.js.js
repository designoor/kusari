async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  // readPath is the path to the file that Claude is trying to read
  const readPath =
    toolArgs.tool_input?.file_path || toolArgs.tool_input?.path || "";

  // Ensure Claude isn't trying to read sensitive files
  const sensitiveFiles = ['.env', '.env.local', '.env.production', 'secrets.json', 'credentials.json'];
  const fileName = readPath.split('/').pop();

  if (sensitiveFiles.includes(fileName)) {
    console.error(`[BLOCKED] Access to sensitive file denied: ${readPath}`);
    console.error(`The file '${fileName}' contains sensitive information and cannot be read.`);
    process.exit(2);
  }

  // Additional check for any path containing .env
  if (readPath.includes('.env')) {
    console.error(`[BLOCKED] Access to .env file denied: ${readPath}`);
    console.error(`Files containing '.env' in their path are restricted for security reasons.`);
    process.exit(2);
  }

  // If all checks pass, allow the read operation
  console.log(JSON.stringify(toolArgs));
  process.exit(0);
}

main();