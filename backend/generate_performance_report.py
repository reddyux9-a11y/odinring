#!/usr/bin/env python3
"""
Generate Comprehensive Performance Diagnostic Report
Combines database and API performance test results
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import glob

class PerformanceReportGenerator:
    """Generate comprehensive performance diagnostic report"""
    
    def __init__(self, db_report_path: str = None, api_report_path: str = None):
        self.db_report_path = db_report_path
        self.api_report_path = api_report_path
        self.report = {
            'generated_at': datetime.now().isoformat(),
            'database_tests': {},
            'api_tests': {},
            'summary': {},
            'diagnostics': {},
            'recommendations': []
        }
    
    def load_reports(self):
        """Load performance test reports"""
        # Auto-detect latest reports if not specified
        if not self.db_report_path:
            db_reports = sorted(glob.glob(str(Path(__file__).parent / "performance_report_*.json")))
            if db_reports:
                self.db_report_path = db_reports[-1]
        
        if not self.api_report_path:
            api_reports = sorted(glob.glob(str(Path(__file__).parent / "api_performance_report_*.json")))
            if api_reports:
                self.api_report_path = api_reports[-1]
        
        # Load database report
        if self.db_report_path and Path(self.db_report_path).exists():
            with open(self.db_report_path, 'r') as f:
                self.report['database_tests'] = json.load(f)
            print(f"✅ Loaded database report: {self.db_report_path}")
        else:
            print("⚠️  No database report found")
        
        # Load API report
        if self.api_report_path and Path(self.api_report_path).exists():
            with open(self.api_report_path, 'r') as f:
                self.api_report_path_data = json.load(f)
                self.report['api_tests'] = self.api_report_path_data
            print(f"✅ Loaded API report: {self.api_report_path}")
        else:
            print("⚠️  No API report found")
    
    def analyze_performance(self):
        """Analyze performance metrics and generate diagnostics"""
        diagnostics = {
            'database_performance': {},
            'api_performance': {},
            'bottlenecks': [],
            'strengths': []
        }
        
        # Analyze database performance
        if self.report['database_tests'].get('tests'):
            db_tests = self.report['database_tests']['tests']
            
            # Read performance
            if 'single_read' in db_tests:
                read_test = db_tests['single_read']
                mean_latency = read_test.get('latency_ms', {}).get('mean', 0)
                diagnostics['database_performance']['read_latency_ms'] = mean_latency
                
                if mean_latency < 20:
                    diagnostics['strengths'].append("Excellent read performance")
                elif mean_latency < 50:
                    diagnostics['strengths'].append("Good read performance")
                elif mean_latency > 100:
                    diagnostics['bottlenecks'].append(f"High read latency: {mean_latency:.2f}ms")
            
            # Write performance
            if 'single_write' in db_tests:
                write_test = db_tests['single_write']
                mean_latency = write_test.get('latency_ms', {}).get('mean', 0)
                diagnostics['database_performance']['write_latency_ms'] = mean_latency
                
                if mean_latency < 50:
                    diagnostics['strengths'].append("Excellent write performance")
                elif mean_latency < 100:
                    diagnostics['strengths'].append("Good write performance")
                elif mean_latency > 200:
                    diagnostics['bottlenecks'].append(f"High write latency: {mean_latency:.2f}ms")
            
            # Concurrent performance
            if 'concurrent_read' in db_tests:
                conc_test = db_tests['concurrent_read']
                throughput = conc_test.get('throughput_ops_per_sec', 0)
                diagnostics['database_performance']['concurrent_read_throughput'] = throughput
                
                if throughput > 100:
                    diagnostics['strengths'].append("Excellent concurrent read throughput")
                elif throughput < 50:
                    diagnostics['bottlenecks'].append(f"Low concurrent read throughput: {throughput:.2f} ops/sec")
        
        # Analyze API performance
        if self.report['api_tests'].get('tests'):
            api_tests = self.report['api_tests']['tests']
            
            for test_name, test_result in api_tests.items():
                if isinstance(test_result, dict) and 'latency_ms' in test_result:
                    mean_latency = test_result['latency_ms'].get('mean', 0)
                    endpoint = test_result.get('endpoint', test_name)
                    
                    if mean_latency > 500:
                        diagnostics['bottlenecks'].append(f"Slow API endpoint {endpoint}: {mean_latency:.2f}ms")
                    elif mean_latency < 100:
                        diagnostics['strengths'].append(f"Fast API endpoint {endpoint}: {mean_latency:.2f}ms")
        
        self.report['diagnostics'] = diagnostics
    
    def generate_recommendations(self):
        """Generate performance recommendations"""
        recommendations = []
        
        # Database recommendations
        if self.report['database_tests'].get('recommendations'):
            recommendations.extend(self.report['database_tests']['recommendations'])
        
        # Additional recommendations based on analysis
        diagnostics = self.report.get('diagnostics', {})
        
        # Check for high latency
        db_perf = diagnostics.get('database_performance', {})
        if db_perf.get('read_latency_ms', 0) > 100:
            recommendations.append({
                'severity': 'high',
                'category': 'database',
                'issue': 'High database read latency',
                'recommendation': 'Implement caching layer (Redis) for frequently accessed data'
            })
        
        if db_perf.get('write_latency_ms', 0) > 200:
            recommendations.append({
                'severity': 'high',
                'category': 'database',
                'issue': 'High database write latency',
                'recommendation': 'Consider batch writes and optimize document structure'
            })
        
        # Check for bottlenecks
        bottlenecks = diagnostics.get('bottlenecks', [])
        if len(bottlenecks) > 3:
            recommendations.append({
                'severity': 'high',
                'category': 'system',
                'issue': 'Multiple performance bottlenecks detected',
                'recommendation': 'Conduct comprehensive performance review and optimization'
            })
        
        self.report['recommendations'] = recommendations
    
    def generate_summary(self):
        """Generate executive summary"""
        summary = {
            'overall_status': 'unknown',
            'key_metrics': {},
            'test_coverage': {},
            'critical_issues': 0,
            'warnings': 0
        }
        
        # Count issues
        for rec in self.report.get('recommendations', []):
            if rec.get('severity') == 'high':
                summary['critical_issues'] += 1
            elif rec.get('severity') == 'medium':
                summary['warnings'] += 1
        
        # Determine overall status
        if summary['critical_issues'] == 0 and summary['warnings'] == 0:
            summary['overall_status'] = 'excellent'
        elif summary['critical_issues'] == 0:
            summary['overall_status'] = 'good'
        elif summary['critical_issues'] < 3:
            summary['overall_status'] = 'needs_attention'
        else:
            summary['overall_status'] = 'critical'
        
        # Key metrics
        if self.report['database_tests'].get('tests'):
            db_tests = self.report['database_tests']['tests']
            if 'single_read' in db_tests:
                summary['key_metrics']['avg_read_latency_ms'] = db_tests['single_read'].get('latency_ms', {}).get('mean', 0)
            if 'single_write' in db_tests:
                summary['key_metrics']['avg_write_latency_ms'] = db_tests['single_write'].get('latency_ms', {}).get('mean', 0)
        
        summary['test_coverage'] = {
            'database_tests': len(self.report.get('database_tests', {}).get('tests', {})),
            'api_tests': len(self.report.get('api_tests', {}).get('tests', {}))
        }
        
        self.report['summary'] = summary
    
    def generate_markdown_report(self) -> str:
        """Generate markdown formatted report"""
        md = []
        md.append("# Performance Diagnostic Report")
        md.append(f"\n**Generated:** {self.report['generated_at']}")
        md.append("\n---\n")
        
        # Executive Summary
        summary = self.report.get('summary', {})
        md.append("## Executive Summary\n")
        status_emoji = {
            'excellent': '🟢',
            'good': '🟡',
            'needs_attention': '🟠',
            'critical': '🔴'
        }
        status = summary.get('overall_status', 'unknown')
        md.append(f"**Overall Status:** {status_emoji.get(status, '⚪')} {status.upper()}")
        md.append(f"\n- **Critical Issues:** {summary.get('critical_issues', 0)}")
        md.append(f"- **Warnings:** {summary.get('warnings', 0)}")
        
        # Key Metrics
        if summary.get('key_metrics'):
            md.append("\n### Key Metrics\n")
            for metric, value in summary['key_metrics'].items():
                md.append(f"- **{metric.replace('_', ' ').title()}:** {value:.2f}")
        
        # Database Performance
        if self.report.get('database_tests', {}).get('tests'):
            md.append("\n## Database Performance\n")
            db_tests = self.report['database_tests']['tests']
            
            for test_name, test_result in db_tests.items():
                if not isinstance(test_result, dict) or 'latency_ms' not in test_result:
                    continue
                
                md.append(f"\n### {test_name.replace('_', ' ').title()}\n")
                latency = test_result['latency_ms']
                md.append(f"- **Mean Latency:** {latency.get('mean', 0):.2f} ms")
                md.append(f"- **Median Latency:** {latency.get('median', 0):.2f} ms")
                md.append(f"- **P95 Latency:** {latency.get('p95', 0):.2f} ms")
                md.append(f"- **P99 Latency:** {latency.get('p99', 0):.2f} ms")
                if 'throughput_ops_per_sec' in test_result:
                    md.append(f"- **Throughput:** {test_result['throughput_ops_per_sec']:.2f} ops/sec")
                md.append(f"- **Success Rate:** {test_result.get('successful', 0)}/{test_result.get('iterations', test_result.get('total_operations', 0))}")
        
        # API Performance
        if self.report.get('api_tests', {}).get('tests'):
            md.append("\n## API Performance\n")
            api_tests = self.report['api_tests']['tests']
            
            for test_name, test_result in api_tests.items():
                if not isinstance(test_result, dict) or 'latency_ms' not in test_result:
                    continue
                
                md.append(f"\n### {test_name.replace('_', ' ').title()}\n")
                md.append(f"- **Endpoint:** {test_result.get('method', 'N/A')} {test_result.get('endpoint', 'N/A')}")
                latency = test_result['latency_ms']
                md.append(f"- **Mean Latency:** {latency.get('mean', 0):.2f} ms")
                md.append(f"- **P95 Latency:** {latency.get('p95', 0):.2f} ms")
                if 'throughput_ops_per_sec' in test_result:
                    md.append(f"- **Throughput:** {test_result['throughput_ops_per_sec']:.2f} ops/sec")
        
        # Diagnostics
        diagnostics = self.report.get('diagnostics', {})
        if diagnostics.get('bottlenecks'):
            md.append("\n## Performance Bottlenecks\n")
            for bottleneck in diagnostics['bottlenecks']:
                md.append(f"- ⚠️ {bottleneck}")
        
        if diagnostics.get('strengths'):
            md.append("\n## Performance Strengths\n")
            for strength in diagnostics['strengths']:
                md.append(f"- ✅ {strength}")
        
        # Recommendations
        if self.report.get('recommendations'):
            md.append("\n## Recommendations\n")
            for i, rec in enumerate(self.report['recommendations'], 1):
                severity_icon = "🔴" if rec.get('severity') == 'high' else "🟡" if rec.get('severity') == 'medium' else "🟢"
                md.append(f"\n### {i}. [{rec.get('severity', 'info').upper()}] {rec.get('category', 'general')}")
                md.append(f"{severity_icon} **Issue:** {rec.get('issue', 'N/A')}")
                md.append(f"\n**Recommendation:** {rec.get('recommendation', 'N/A')}")
        
        return "\n".join(md)
    
    def save_report(self, filename: str = None):
        """Save comprehensive report"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"comprehensive_performance_report_{timestamp}"
        
        # Save JSON
        json_path = Path(__file__).parent / f"{filename}.json"
        with open(json_path, 'w') as f:
            json.dump(self.report, f, indent=2)
        
        # Save Markdown
        md_path = Path(__file__).parent / f"{filename}.md"
        with open(md_path, 'w') as f:
            f.write(self.generate_markdown_report())
        
        print(f"\n✅ Comprehensive report saved:")
        print(f"   JSON: {json_path}")
        print(f"   Markdown: {md_path}")
        
        return json_path, md_path
    
    def run(self):
        """Run report generation"""
        print("=" * 80)
        print("Generating Comprehensive Performance Diagnostic Report")
        print("=" * 80)
        
        self.load_reports()
        self.analyze_performance()
        self.generate_recommendations()
        self.generate_summary()
        
        json_path, md_path = self.save_report()
        
        print("\n" + "=" * 80)
        print("Report Generation Complete")
        print("=" * 80)
        print(f"\n📄 View the markdown report: {md_path}")
        print(f"📊 View the JSON report: {json_path}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate Performance Diagnostic Report')
    parser.add_argument('--db-report', type=str, help='Path to database performance report')
    parser.add_argument('--api-report', type=str, help='Path to API performance report')
    args = parser.parse_args()
    
    generator = PerformanceReportGenerator(
        db_report_path=args.db_report,
        api_report_path=args.api_report
    )
    
    generator.run()


if __name__ == "__main__":
    main()



