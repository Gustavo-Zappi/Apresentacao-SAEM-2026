from CoolProp.CoolProp import PropsSI as P
F='Water'
def cycle(pb, pc, T3=None, eta_t=1.0, eta_p=1.0, reheat=None, W=100e6):
    # state 1: sat liquid at pc
    h1=P('H','P',pc,'Q',0,F); s1=P('S','P',pc,'Q',0,F); v1=1/P('D','P',pc,'Q',0,F)
    h2s=h1+v1*(pb-pc); h2=h1+(h2s-h1)/eta_p
    if T3 is None: h3=P('H','P',pb,'Q',1,F); s3=P('S','P',pb,'Q',1,F)
    else: h3=P('H','P',pb,'T',T3+273.15,F); s3=P('S','P',pb,'T',T3+273.15,F)
    wt=0; qin=h3-h2
    if reheat:
        pr,Tr=reheat
        h4s=P('H','P',pr,'S',s3,F); h4=h3-eta_t*(h3-h4s); wt+=h3-h4
        h5=P('H','P',pr,'T',Tr+273.15,F); s5=P('S','P',pr,'T',Tr+273.15,F); qin+=h5-h4
        h6s=P('H','P',pc,'S',s5,F); h6=h5-eta_t*(h5-h6s); wt+=h5-h6; hout=h6
    else:
        h4s=P('H','P',pc,'S',s3,F); h4=h3-eta_t*(h3-h4s); wt=h3-h4; hout=h4
    x=P('Q','P',pc,'H',hout,F)
    wp=h2-h1; wnet=wt-wp; eta=wnet/qin; m=W/wnet
    Qout=m*(hout-h1)
    return dict(eta=eta*100,x=x,wnet=wnet/1e3,wt=wt/1e3,wp=wp/1e3,m=m,mh=m*3.6,Qin=m*qin/1e6,Qout=Qout/1e6,bwr=wp/wt*100)
cases={
 'A ideal, 8 MPa vapor sat., 8 kPa':cycle(8e6,8e3),
 'B ideal + superaquec. 480C':cycle(8e6,8e3,T3=480),
 'C ideal + superaq. 480C + reaquec. 0,7 MPa/440C':cycle(8e6,8e3,T3=480,reheat=(0.7e6,440)),
 'D real (eta_t=85%, eta_p=85%), vapor sat.':cycle(8e6,8e3,eta_t=.85,eta_p=.85),
 'E real 85% + superaq. 480C + reaquec.':cycle(8e6,8e3,T3=480,eta_t=.85,eta_p=.85,reheat=(0.7e6,440)),
}
for k,v in cases.items():
    print(k); print('  ',{a:round(b,3) for a,b in v.items()})
# Carnot comparison
Th=P('T','P',8e6,'Q',1,F); Tc=P('T','P',8e3,'Q',0,F)
print('Tsat 8MPa C',Th-273.15,'Tsat 8kPa C',Tc-273.15,'Carnot',100*(1-Tc/Th))
print('sweep pressure (superheat 480C, ideal):')
for pb in [2,4,6,8,10,12,15]:
    r=cycle(pb*1e6,8e3,T3=480); print(pb,'MPa eta',round(r['eta'],1),'x',round(r['x'],3))
