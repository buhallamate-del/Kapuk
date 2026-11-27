import glob,os
d=os.path.dirname(os.path.abspath(__file__))
shell=open(f'{d}/src/00_shell.html').read()
js='\n'.join(open(f).read() for f in sorted(glob.glob(f'{d}/src/*.js')))
open(f'{d}/index.html','w').write(shell.replace('/*__SCRIPT__*/',js))
print('index.html', len(shell)+len(js))
