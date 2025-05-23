---
title: "Deploying Kubernetes Cluster on CentOS 7"
date: "2018-07-30"
categories: 
  - "linux"
tags: 
  - "docker"
  - "kubernetes"
---

It is painful to deploying a Kubernetes cluster in mainland China. The installation requires access to Google servers, which is not so easy for every one. Fortunately, there are mirrors or alternative ways. I'll use Docker v1.13 and Kubernetes v1.11 in the article.

#### 1\. Install Docker

CentOS SCL should be enabled first.

```
# yum install centos-release-scl
# yum install docker
```

#### 2\. Install Kubernetes

##### 2.1 Add the Aliyun mirror for Kubernetes packages

```
# cat << EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
       http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
# yum install -y kubelet kubectl kubeadm
```

##### 2.2 Precheck OS environmemt

```
# kubeadm init --kubernetes-version=v1.11.1
```

Run the init command by specify the version, the access to Google server is avoided. The script also advices you to turn off firewalld, swap, selinux and enable kernel parameters:

```
# systemctl stop firewalld
# systemctl disable firewalld
# swapoff -a
# setenforce 0
```

Open `/etc/sysconfig/selinux`, change `enforcing` to `permissive`. Create `/etc/sysctl.d/k8s.conf` with content:

```
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1

```

```
# sysctl --system
```

Remember to comment out swap volumes from `/etc/fstab`.

##### 2.3 Pull Kubernates images

Pull the Kubernetes images from docker/docker-cn mirror maintained by [anjia0532](https://anjia0532.github.io/2017/11/15/gcr-io-image-mirror/). These are minimal images required for a Kubernetes master installation.

```
# docker pull registry.docker-cn.com/anjia0532/google-containers.kube-apiserver-amd64:v1.11.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.kube-controller-manager-amd64:v1.11.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.kube-scheduler-amd64:v1.11.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.kube-proxy-amd64:v1.11.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.pause:3.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.etcd-amd64:3.2.18
# docker pull registry.docker-cn.com/anjia0532/google-containers.coredns:1.1.3

```

These version numbers comes from the `kubeadm init` command if you cannot access Google servers. These images should be retagged to gcr.io ones before next steps, or the kubeadm command line would not find them:

```
# docker tag registry.docker-cn.com/anjia0532/google-containers.kube-apiserver-amd64:v1.11.1 k8s.gcr.io/kube-apiserver-amd64:v1.11.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.kube-controller-manager-amd64:v1.11.1 k8s.gcr.io/kube-controller-manager-amd64:v1.11.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.kube-scheduler-amd64:v1.11.1 k8s.gcr.io/kube-scheduler-amd64:v1.11.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.kube-proxy-amd64:v1.11.1 k8s.gcr.io/kube-proxy-amd64:v1.11.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.pause:3.1 k8s.gcr.io/pause:3.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.etcd-amd64:3.2.18 k8s.gcr.io/etcd-amd64:3.2.18
# docker tag registry.docker-cn.com/anjia0532/google-containers.coredns:1.1.3 k8s.gcr.io/coredns:1.1.3

```

Now the output of `docker images` looks like:

```
REPOSITORY                                                                         TAG                 IMAGE ID            CREATED             SIZE
k8s.gcr.io/kube-apiserver-amd64                                                    v1.11.1             816332bd9d11        12 days ago         187 MB
registry.docker-cn.com/anjia0532/google-containers.kube-apiserver-amd64            v1.11.1             816332bd9d11        12 days ago         187 MB
k8s.gcr.io/kube-controller-manager-amd64                                           v1.11.1             52096ee87d0e        12 days ago         155 MB
registry.docker-cn.com/anjia0532/google-containers.kube-controller-manager-amd64   v1.11.1             52096ee87d0e        12 days ago         155 MB
k8s.gcr.io/kube-scheduler-amd64                                                    v1.11.1             272b3a60cd68        12 days ago         56.8 MB
registry.docker-cn.com/anjia0532/google-containers.kube-scheduler-amd64            v1.11.1             272b3a60cd68        12 days ago         56.8 MB
k8s.gcr.io/kube-proxy-amd64                                                        v1.11.1             d5c25579d0ff        12 days ago         97.8 MB
registry.docker-cn.com/anjia0532/google-containers.kube-proxy-amd64                v1.11.1             d5c25579d0ff        12 days ago         97.8 MB
k8s.gcr.io/pause                                                                   3.1                 da86e6ba6ca1        7 months ago        742 kB
registry.docker-cn.com/anjia0532/google-containers.pause                           3.1                 da86e6ba6ca1        7 months ago        742 kB
k8s.gcr.io/etcd-amd64                                                              3.2.18              b8df3b177be2        3 months ago        219 MB
registry.docker-cn.com/anjia0532/google-containers.etcd-amd64                      3.2.18              b8df3b177be2        3 months ago        219 MB
k8s.gcr.io/coredns                                                                 1.1.3               b3b94275d97c        2 months ago        45.6 MB
registry.docker-cn.com/anjia0532/google-containers.coredns                         1.1.3               b3b94275d97c        2 months ago        45.6 MB

```

Also `KUBE_REPO_PREFIX` and other environment variables can be used to customize the prefix. I have no time to verify them.

##### 2.4 Start the Kubernetes master

Run the init script again and it will success with further guidelines:

```
# kubeadm init --kubernetes-version=v1.11.1
...
...
...
Your Kubernetes master has initialized successfully!

To start using your cluster, you need to run (as a regular user):

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the addon options listed at:
  http://kubernetes.io/docs/admin/addons/

You can now join any number of machines by running the following on each node
as root:

  kubeadm join 192.168.11.235:6443 --token d624xt.3eqs1udhr26w5luh --discovery-token-ca-cert-hash sha256:a0088da6f0445370457b1aeede4856caa580280e58cdea974f1110bc1b7d4a63

```

Run the mkdir/cp/chown command to enable `kubectl` usage. Then add the `weave` pod network. It may take some time, since images are pulled.

```
# kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```

Now the master is finished, verify with the `Ready` status:

```
# kubectl get nodes
NAME        STATUS    ROLES     AGE       VERSION
cdh-node1   Ready     master    2h        v1.11.1

```

##### 2.4 Start the Kubernetes node(slave)

A Kubernetes node only requires `kube-proxy-amd64` and `pause` images, pull these ones:

```
# docker pull registry.docker-cn.com/anjia0532/google-containers.kube-proxy-amd64:v1.11.1
# docker pull registry.docker-cn.com/anjia0532/google-containers.pause:3.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.kube-proxy-amd64:v1.11.1 k8s.gcr.io/kube-proxy-amd64:v1.11.1
# docker tag registry.docker-cn.com/anjia0532/google-containers.pause:3.1 k8s.gcr.io/pause:3.1
```

Weave images can also been prefetched:

```
# docker images
REPOSITORY                                                            TAG                 IMAGE ID            CREATED             SIZE
docker.io/weaveworks/weave-npc                                        2.4.0               647ad6d59818        4 days ago          49.1 MB
docker.io/weaveworks/weave-kube                                       2.4.0               86ff1a48ce14        4 days ago          131 MB

```

Join the node to our Kubernetes master by running the command line in the `kubeadm init` output:

```
# kubeadm join 192.168.11.235:6443 --token d624xt.3eqs1udhr26w5luh --discovery-token-ca-cert-hash sha256:a0088da6f0445370457b1aeede4856caa580280e58cdea974f1110bc1b7d4a63

```

##### 3\. Verify Kubernetes cluster status

Verify nodes with:

```
# kubectl get nodes -o wide
NAME        STATUS    ROLES     AGE       VERSION   INTERNAL-IP      EXTERNAL-IP   OS-IMAGE                KERNEL-VERSION          CONTAINER-RUNTIME
cdh-node1   Ready     master    43m       v1.11.1   192.168.11.235           CentOS Linux 7 (Core)   3.10.0-862.el7.x86_64   docker://1.13.1
cdh-node2   Ready         41m       v1.11.1   192.168.11.236           CentOS Linux 7 (Core)   3.10.0-862.el7.x86_64   docker://1.13.1

```

Verify internal pods with:

```
# kubectl get pods -o wide --all-namespaces
NAMESPACE     NAME                                    READY     STATUS    RESTARTS   AGE       IP               NODE
kube-system   coredns-78fcdf6894-f4qsc                1/1       Running   0          43m       10.32.0.3        cdh-node1
kube-system   coredns-78fcdf6894-rx48j                1/1       Running   0          43m       10.32.0.2        cdh-node1
kube-system   etcd-cdh-node1                          1/1       Running   0          42m       192.168.11.235   cdh-node1
kube-system   kube-apiserver-cdh-node1                1/1       Running   0          42m       192.168.11.235   cdh-node1
kube-system   kube-controller-manager-cdh-node1       1/1       Running   0          42m       192.168.11.235   cdh-node1
kube-system   kube-proxy-f46pz                        1/1       Running   0          43m       192.168.11.235   cdh-node1
kube-system   kube-proxy-zrdm5                        1/1       Running   0          41m       192.168.11.236   cdh-node2
kube-system   kube-scheduler-cdh-node1                1/1       Running   0          42m       192.168.11.235   cdh-node1
kube-system   weave-net-l6z9q                         2/2       Running   1          41m       192.168.11.236   cdh-node2
kube-system   weave-net-tkfrs                         2/2       Running   0          42m       192.168.11.235   cdh-node1

```

If the status of a pod is not `Running`, get the detailed info from:

```
# kubectl describe pod weave-net-l6z9q -n kube-system
```

If something goes wrong, and you cannot restore from it, simply reset the master/node:

```
# kubeadm reset
```

##### 4\. Install Kubernetes Dashboard

By default, all user pods are allocated on Kubernetes nodes(slaves). Pull the dashboard image in advance on the node machine:

```
# docker pull registry.docker-cn.com/anjia0532/google-containers.kubernetes-dashboard-amd64:v1.8.3
# docker tag registry.docker-cn.com/anjia0532/google-containers.kubernetes-dashboard-amd64:v1.8.3 k8s.gcr.io/kubernetes-dashboard-amd64:v1.8.3

```

Install with alternative setup, since recommended setup is not so friendly in a development envronment:

```
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v1.8.3/src/deploy/alternative/kubernetes-dashboard.yaml

```

Refer [here](https://github.com/kubernetes/dashboard/wiki/Accessing-Dashboard---1.7.X-and-above) for remote access:

```
# kubectl -n kube-system edit service kubernetes-dashboard
```

Change `type: ClusterIP` to `type: NodePort` and save file. Next we need to check port on which Dashboard was exposed.

```
# kubectl -n kube-system get service kubernetes-dashboard
NAME                   TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
kubernetes-dashboard   NodePort   10.106.156.70           80:31023/TCP   34m

```

Now, you can access with: `http://<master-ip>:31023/`. You can [grant](https://github.com/kubernetes/dashboard/wiki/Access-control) admin grant full admin privileges to Dashboard's Service Account in the development environment for convenience:

```
# cat dashboard-admin.yaml
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: kubernetes-dashboard
  labels:
    k8s-app: kubernetes-dashboard
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: kubernetes-dashboard
  namespace: kube-system
# kubectl create -f dashboard-admin.yaml
```

##### 5\. Troubleshoting

In my office environment, errors occur and the `coredns` are always in `CrashLoopBackOff` status:

```
Failed to list *api.Endpoints: Get https://10.96.0.1:443/api/v1/endpoints?resourceVersion=0: dial tcp 10.96.0.1:443: i/o timeout
```

I Googled a lot, read answers from Stackoverflow and Github, reset iptables/docker/kubernetes, but still failed to solve it. There ARE unresolved issues like [#60315](https://github.com/kubernetes/kubernetes/issues/60315). So I tried to switch to `flannel` network instead of `weave`. First, Kubernetes and `weave` need to be reset:

```
# curl -L git.io/weave -o /usr/local/bin/weave
# chmod a+x /usr/local/bin/weave
# weave reset
# kubeadm reset

```

This time, initialize `kubeadm` and network with:

```
# kubeadm init --kubernetes-version=v1.11.1 --pod-network-cidr=10.244.0.0/16
# kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/v0.10.0/Documentation/kube-flannel.yml

```

The `flannel` image can be pulled first:

```
# docker pull quay.io/coreos/flannel:v0.10.0-amd64
```

Everything works. Also referred [here](https://kubernetes.feisky.xyz/en/troubleshooting/network.html).

**Updated May 7, 2019**: Kubernetes 1.13 finally add a command line switch to use an alternative repository. Simply run `kubeadm` with:

```
# kubeadm init --kubernetes-version=v1.14.1 --image-repository registry.aliyuncs.com/google_containers

```

And verify with `docker images`.

**Updated May 10, 2019**: If using Ubuntu/Linuxmint, add repository with:

```
# curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -
# cat << EOF > /etc/apt/sources.list.d/kubernetes.list 
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main 
EOF
```

**Updated June 3, 2019**: flannel seems to have a close version dependency on kubernetes version. When deploying kubernetes 1.14, a specific git version should be used, according to the [official document](https://v1-14.docs.kubernetes.io/docs/setup/independent/create-cluster-kubeadm/):

```
# kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/62e44c867a2846fefb68bd5f178daf4da3095ccb/Documentation/kube-flannel.yml
```

**Updated Jan 11, 2022**: Just deployed a new cluster with docker 20.10.12 & kubernetes 1.23.1. 1. kubeadm defaults to `systemd`, instead of `cgroupfs` as the container runtime cgroup driver. In docker case, edit `/etc/docker/daemon.json`, and restart docker service:

```
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```

2\. flannel script updated:

```
# flannel v0.16.1
# kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

3\. kubernetes dashboard script updated:

```
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.4.0/aio/deploy/recommended.yaml
```

The recommended configuration enables HTTPS, and an auto-generated certificate is used. Now follow the document to create an admin user and get the login token: [https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md](https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md). Get the token with:

```
# kubectl -n kubernetes-dashboard get secret $(kubectl -n kubernetes-dashboard get sa/admin-user -o jsonpath="{.secrets[0].name}") -o go-template="{{.data.token | base64decode}}"
```
