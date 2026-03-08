import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink } from "lucide-react";

const sdks = [
  {
    name: "JavaScript / Node.js",
    language: "javascript",
    install: "npm install @triponic/sdk",
    example: `import Triponic from '@triponic/sdk';

const triponic = new Triponic({
  apiKey: 'your_api_key'
});

const recommendations = await triponic.recommendations.get({
  budget: 'medium',
  interests: ['culture', 'food']
});`
  },
  {
    name: "Python",
    language: "python",
    install: "pip install triponic-sdk",
    example: `from triponic import Triponic

client = Triponic(api_key='your_api_key')

recommendations = client.recommendations.get(
    budget='medium',
    interests=['culture', 'food']
)`
  },
  {
    name: "Ruby",
    language: "ruby",
    install: "gem install triponic",
    example: `require 'triponic'

client = Triponic::Client.new(api_key: 'your_api_key')

recommendations = client.recommendations.get(
  budget: 'medium',
  interests: ['culture', 'food']
)`
  }
];

export default function SDKSection() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200/60 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl font-bold text-slate-900">Official SDKs</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Get started quickly with our official client libraries</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {sdks.map((sdk, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{sdk.name}</h3>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      Official
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Installation:</p>
                    <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                      <code>{sdk.install}</code>
                    </pre>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Quick Start:</p>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{sdk.example}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/60 shadow-lg bg-gradient-to-br from-indigo-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Need help getting started?</h3>
              <p className="text-slate-600 mb-4">
                Check out our comprehensive guides, tutorials, and code examples
              </p>
              <Button className="bg-gradient-to-r from-indigo-600 to-cyan-500">
                View Documentation
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}