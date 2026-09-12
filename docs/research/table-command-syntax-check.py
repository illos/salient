"""Bounded research recognizer for the table-command syntax fixtures.

Run: python3 docs/research/table-command-syntax-check.py
This is not an application parser, machine binder or rules-engine implementation.
"""

import json, re, math
from pathlib import Path

class Invalid(ValueError): pass
class Reader:
    def __init__(self, s): self.s, self.i = s, 0
    def fail(self, why): raise Invalid(f'{why} at {self.i}')
    def ws(self):
        start = self.i
        while self.i < len(self.s) and self.s[self.i] in ' \t': self.i += 1
        return self.i > start
    def lit(self, s):
        if not self.s.startswith(s, self.i): self.fail('expected ' + s)
        self.i += len(s)
    def token(self, pat):
        m = re.match(pat, self.s[self.i:])
        if not m: self.fail('token')
        self.i += len(m[0]); return m[0]
    def string(self):
        if not self.s.startswith('"', self.i): self.fail('string')
        try: val, n = json.JSONDecoder().raw_decode(self.s[self.i:])
        except ValueError: self.fail('JSON string')
        if any(0xD800 <= ord(c) <= 0xDFFF for c in val): self.fail('invalid Unicode scalar')
        self.i += n; return val
    def ref(self):
        self.lit('@')
        if self.s.startswith('{', self.i):
            self.i += 1
            kind = self.token(r'[a-z][a-z0-9-]*'); self.lit(':')
            value = self.token(r'[A-Za-z0-9][A-Za-z0-9_:./-]*'); self.lit('}')
            return {'refKind':kind, 'id':value}
        if self.s.startswith('"', self.i): return {'name': self.string()}
        val = self.token(r'[A-Za-z][A-Za-z0-9_-]*')
        return {'selector':'self'} if val == 'self' else {'name':val}
    def value(self):
        if self.i >= len(self.s): self.fail('value')
        c = self.s[self.i]
        if c == '@': return self.ref()
        if c == '"': return self.string()
        if c == '[':
            self.i += 1; self.ws(); out=[]
            if self.s.startswith(']', self.i): self.i += 1; return out
            while True:
                out.append(self.value()); self.ws()
                if self.s.startswith(']', self.i): self.i += 1; return out
                self.lit(','); self.ws()
        if c == '{':
            self.i += 1; self.ws(); out={}
            if self.s.startswith('}', self.i): self.i += 1; return {'record':out}
            while True:
                key=self.string(); self.ws(); self.lit(':'); self.ws()
                if key in out: self.fail('duplicate key')
                out[key]=self.value(); self.ws()
                if self.s.startswith('}', self.i): self.i += 1; return {'record':out}
                self.lit(','); self.ws()
        if c.isdigit() or c == '-':
            val = json.loads(self.token(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?'))
            if isinstance(val, float) and not math.isfinite(val): self.fail('nonfinite number')
            return val
        val=self.token(r'[A-Za-z][A-Za-z0-9_-]*')
        if val in ('true','false','null'): return json.loads(val)
        return {'symbol':val}
    def command(self):
        self.ws(); actor=None
        if self.s.startswith('@', self.i):
            actor=self.ref()
            if not self.ws(): self.fail('space after actor')
        self.lit('/'); path=[self.token(r'[a-z][a-z0-9-]*')]; args={}; started=False
        while self.i < len(self.s):
            if not self.ws(): self.fail('space before argument/path')
            if self.i == len(self.s): break
            word=self.token(r'[a-z][a-z0-9-]*'); after=self.i; self.ws()
            if self.s.startswith('=', self.i):
                started=True; self.i+=1; self.ws()
                if word in args: self.fail('duplicate argument')
                args[word]=self.value()
            else:
                if started: self.fail('path after arguments')
                path.append(word); self.i=after
        return {'actor':actor,'path':path,'arguments':args}

def parse(s): return Reader(s).command()

if __name__ == '__main__':
    cases=json.loads(Path(__file__).with_name('table-command-syntax-cases.json').read_text())
    errors=[]
    for c in cases:
        try:
            tree=parse(c['input'])
            if not c['valid']: errors.append((c['id'],'unexpected acceptance'))
            elif 'expected' in c and tree != c['expected']: errors.append((c['id'],'wrong structure',tree))
        except Invalid as e:
            if c['valid']: errors.append((c['id'],str(e)))
    print(json.dumps({'cases':len(cases),'passed':len(cases)-len(errors),'failures':errors},indent=2))
    raise SystemExit(bool(errors))
