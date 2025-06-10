#!/usr/bin/env node

/**
 * Exemple d'utilisation simple du serveur MCP Weather
 * 
 * Ce script montre comment utiliser le serveur via stdio
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

class SimpleMCPClient {
  private process: any;
  private requestId = 1;

  async start() {
    // Démarrer le serveur MCP
    this.process = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: resolve(process.cwd()),
    });

    // Attendre un peu pour que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Serveur MCP Weather démarré');
  }

  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      let responseData = '';

      const timeout = setTimeout(() => {
        reject(new Error('Timeout: Pas de réponse du serveur'));
      }, 10000);

      this.process.stdout.on('data', (data: Buffer) => {
        responseData += data.toString();
        
        try {
          const lines = responseData.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          
          if (response.id === request.id) {
            clearTimeout(timeout);
            resolve(response);
          }
        } catch (error) {
          // Pas encore une réponse JSON complète
        }
      });

      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, arguments_: any) {
    return this.sendRequest('tools/call', {
      name,
      arguments: arguments_,
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
    }
  }
}

// Exemple d'utilisation
async function demonstrateWeatherMCP() {
  const client = new SimpleMCPClient();

  try {
    console.log('🚀 Démarrage du client MCP Weather...\n');
    
    await client.start();

    // Lister les outils disponibles
    console.log('📋 Récupération de la liste des outils...');
    const toolsResponse = await client.listTools();
    
    if (toolsResponse.result?.tools) {
      console.log('✅ Outils disponibles:');
      toolsResponse.result.tools.forEach((tool: any) => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    }

    console.log('\n🌤️  Test de la météo actuelle pour Paris...');
    const weatherResponse = await client.callTool('get_weather', {
      city: 'Paris',
      country: 'FR',
      lang: 'fr',
      units: 'metric',
    });

    if (weatherResponse.result?.content) {
      console.log('✅ Météo reçue:');
      console.log(weatherResponse.result.content[0].text);
    }

    console.log('\n📅 Test des prévisions pour Londres...');
    const forecastResponse = await client.callTool('get_weather_forecast', {
      city: 'London',
      country: 'GB',
      lang: 'fr',
      units: 'metric',
    });

    if (forecastResponse.result?.content) {
      console.log('✅ Prévisions reçues:');
      console.log(forecastResponse.result.content[0].text);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.stop();
    console.log('\n🛑 Client arrêté');
  }
}

// Vérifier que le fichier .env existe et contient une clé API
function checkConfiguration() {
  try {
    const envContent = readFileSync('.env', 'utf8');
    if (!envContent.includes('WEATHER_API_KEY=') || envContent.includes('your_openweathermap_api_key_here')) {
      console.error('❌ Configuration manquante:');
      console.error('   1. Copiez .env.example vers .env');
      console.error('   2. Ajoutez votre clé API OpenWeatherMap');
      console.error('   3. Relancez ce script');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fichier .env non trouvé. Copiez .env.example vers .env et configurez votre clé API.');
    process.exit(1);
  }
}

// Point d'entrée principal
if (import.meta.url === `file://${process.argv[1]}`) {
  checkConfiguration();
  demonstrateWeatherMCP().catch(console.error);
}
