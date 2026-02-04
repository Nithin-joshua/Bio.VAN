import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class SincConv_fast(nn.Module):
    """Sinc-based convolution
    Parameters:
    -----------------
    out_channels : `int`
        Number of filters.
    kernel_size : `int`
        Filter length.
    sample_rate : `int`, optional
        Sample rate. Defaults to 16000.
    Usage:
    -----------------
    conv = SincConv_fast(out_channels, kernel_size, sample_rate)
    out = conv(input) # input shape: [batch, 1, seq_len]
    """

    @staticmethod
    def to_mel(hz):
        return 2595 * np.log10(1 + hz / 700)

    @staticmethod
    def to_hz(mel):
        return 700 * (10 ** (mel / 2595) - 1)

    def __init__(self, out_channels, kernel_size, sample_rate=16000, in_channels=1,
                 stride=1, padding=0, dilation=1, bias=False, groups=1, min_low_hz=50, min_band_hz=50):

        super(SincConv_fast, self).__init__()

        if in_channels != 1:
            #msg = (f'SincConv only support one input channel '
            #       f'(here, in_channels = {in_channels:d}).')
            msg = "SincConv only support one input channel (here, in_channels = {%i})" % (in_channels)
            raise ValueError(msg)

        self.out_channels = out_channels
        self.kernel_size = kernel_size
        
        # Forcing the filters to be odd (i.e, perfectly symmetrics)
        if kernel_size % 2 == 0:
            self.kernel_size = self.kernel_size + 1

        self.stride = stride
        self.padding = padding
        self.dilation = dilation

        if bias:
            raise ValueError('SincConv does not support bias.')
        if groups > 1:
            raise ValueError('SincConv does not support groups.')

        self.sample_rate = sample_rate
        self.min_low_hz = min_low_hz
        self.min_band_hz = min_band_hz

        # initialize filterbanks such that they are equally spaced in Mel scale
        low_hz = 30
        high_hz = self.sample_rate / 2 - (self.min_low_hz + self.min_band_hz)

        mel = np.linspace(self.to_mel(low_hz),
                          self.to_mel(high_hz),
                          self.out_channels + 1)
        hz = self.to_hz(mel)

        # filter lower frequency (out_channels, 1)
        self.low_hz_ = nn.Parameter(torch.Tensor(hz[:-1]).view(-1, 1))

        # filter band frequency (out_channels, 1)
        self.band_hz_ = nn.Parameter(torch.Tensor(np.diff(hz)).view(-1, 1))

        # Hamming window
        #self.window_ = torch.hamming_window(self.kernel_size)
        n_lin=torch.linspace(0, (self.kernel_size/2)-1, steps=int((self.kernel_size/2))) # computing only half of the window
        self.window_=0.54-0.46*torch.cos(2*3.141592653589793*n_lin/self.kernel_size);


    def forward(self, waveforms):
        """
        Parameters
        ----------
        waveforms : `torch.Tensor` (batch_size, 1, n_samples)
            Batch of waveforms.
        Returns
        -------
        features : `torch.Tensor` (batch_size, out_channels, n_samples_out)
            Batch of sinc filters activations.
        """

        self.n_ = 2 * 3.141592653589793 * torch.arange(-(self.kernel_size - 1) / 2.0,
                                                         (self.kernel_size - 1) / 2.0 + 1).view(1, -1) / self.sample_rate
        self.n_ = self.n_.to(waveforms.device)
        self.window_ = self.window_.to(waveforms.device)

        low = self.min_low_hz  + torch.abs(self.low_hz_)
        
        high = torch.clamp(low + self.min_band_hz + torch.abs(self.band_hz_),self.min_low_hz,self.sample_rate/2)
        band = (high-low)[:,0]
        
        f_times_t_low = torch.matmul(low, self.n_)
        f_times_t_high = torch.matmul(high, self.n_)

        band_pass_left=((torch.sin(f_times_t_high)-torch.sin(f_times_t_low))/(self.n_/2))*self.window_ 
        band_pass_center = 2*band.view(-1,1)
        band_pass_right= torch.flip(band_pass_left,dims=[1])
        
        
        band_pass=torch.cat([band_pass_left,band_pass_center,band_pass_right],dim=1)

        
        band_pass = band_pass / (2*band[:,None])
        

        self.filters = (band_pass).view(
            self.out_channels, 1, self.kernel_size)

        return F.conv1d(waveforms, self.filters, stride=self.stride,
                        padding=self.padding, dilation=self.dilation,
                        bias=None, groups=1) 


class FMS(nn.Module):
    def __init__(self, nb_dim):
        super(FMS, self).__init__()
        self.fc = nn.Linear(nb_dim, nb_dim)
        self.sig = nn.Sigmoid()

    def forward(self, x):
        y = F.adaptive_avg_pool1d(x, 1).view(x.size(0), -1)
        y = self.sig(self.fc(y)).view(x.size(0), x.size(1), -1)
        x = x * y + y
        return x

class Residual_block(nn.Module):
    def __init__(self, nb_fil, first=False):
        super(Residual_block, self).__init__()
        self.first = first
        if not self.first:
            self.bn1 = nn.BatchNorm1d(num_features=nb_fil)
        self.lrelu = nn.LeakyReLU(negative_slope=0.3)
        self.conv1 = nn.Conv1d(in_channels=nb_fil,
                               out_channels=nb_fil,
                               kernel_size=3,
                               padding=1,
                               stride=1)
        self.bn2 = nn.BatchNorm1d(num_features=nb_fil)
        self.conv2 = nn.Conv1d(in_channels=nb_fil,
                               out_channels=nb_fil,
                               kernel_size=3,
                               padding=1,
                               stride=1)
        if self.first:
            self.mp = nn.MaxPool1d(3)
        else:
            self.mp = nn.MaxPool1d(3)
        self.fms = FMS(nb_fil)

    def forward(self, x):
        if not self.first:
            x = self.bn1(x)
            x = self.lrelu(x)
        
        org_x = x
        x = self.conv1(x)
        x = self.bn2(x)
        x = self.lrelu(x)
        x = self.conv2(x)
        x = self.mp(x)
        x = self.fms(x)
        
        if self.first:
            org_x = self.mp(org_x)
            
        x += org_x
        return x

class RawNet2(nn.Module):
    def __init__(self, d_args):
        super(RawNet2, self).__init__()

        self.Sinc_conv = SincConv_fast(out_channels=d_args['nb_fil'],
                                       kernel_size=d_args['first_conv'],
                                       sample_rate=d_args['sample_rate'],
                                       min_low_hz=d_args['min_low_hz'],
                                       min_band_hz=d_args['min_band_hz']
                                       )

        self.first_bn = nn.BatchNorm1d(num_features=d_args['nb_fil'])
        self.selu = nn.SELU(inplace=True)
        self.block0 = Residual_block(d_args['nb_fil'], first=True)
        self.block1 = Residual_block(d_args['nb_fil'])
        self.block2 = Residual_block(d_args['nb_fil'])
        self.block3 = Residual_block(d_args['nb_fil'])
        self.block4 = Residual_block(d_args['nb_fil'])
        self.block5 = Residual_block(d_args['nb_fil'])

        self.avgpool = nn.AdaptiveAvgPool1d(1)

        self.fc_attention0 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])
        self.fc_attention1 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])
        self.fc_attention2 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])
        self.fc_attention3 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])
        self.fc_attention4 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])
        self.fc_attention5 = self._make_attention_fc(in_features=d_args['nb_fil'],
                                                     l_out_features=d_args['nb_fil'])

        self.bn_before_gru = nn.BatchNorm1d(num_features=d_args['nb_fil'])
        self.gru = nn.GRU(input_size=d_args['nb_fil'],
                          hidden_size=d_args['gru_node'],
                          num_layers=d_args['nb_gru_layer'],
                          batch_first=True)
        self.fc1_gru = nn.Linear(in_features=d_args['gru_node'],
                                 out_features=d_args['nb_fc_node'])
        self.fc2_gru = nn.Linear(in_features=d_args['nb_fc_node'],
                                 out_features=d_args['nb_classes'],
                                 bias=True)

    def _make_attention_fc(self, in_features, l_out_features):
        l_fc = []
        l_fc.append(nn.Linear(in_features=in_features,
                              out_features=l_out_features))
        return nn.Sequential(*l_fc)

    def forward(self, x):
        """
        x: [batch, 1, seq_len] or [batch, seq_len]
        """
        # Ensure input is [batch, 1, seq_len]
        if x.dim() == 2:
            x = x.unsqueeze(1)

        x = self.Sinc_conv(x)
        x = self.first_bn(x)
        x = self.selu(x)

        x0 = self.block0(x)
        y0 = self.avgpool(x0).view(x0.size(0), -1) 
        y0 = self.fc_attention0(y0)
        y0 = torch.sigmoid(y0).view(y0.size(0), y0.size(1), -1)
        x = x0 * y0 + y0

        x1 = self.block1(x)
        y1 = self.avgpool(x1).view(x1.size(0), -1)
        y1 = self.fc_attention1(y1)
        y1 = torch.sigmoid(y1).view(y1.size(0), y1.size(1), -1)
        x = x1 * y1 + y1

        x2 = self.block2(x)
        y2 = self.avgpool(x2).view(x2.size(0), -1)
        y2 = self.fc_attention2(y2)
        y2 = torch.sigmoid(y2).view(y2.size(0), y2.size(1), -1)
        x = x2 * y2 + y2

        x3 = self.block3(x)
        y3 = self.avgpool(x3).view(x3.size(0), -1)
        y3 = self.fc_attention3(y3)
        y3 = torch.sigmoid(y3).view(y3.size(0), y3.size(1), -1)
        x = x3 * y3 + y3

        x4 = self.block4(x)
        y4 = self.avgpool(x4).view(x4.size(0), -1)
        y4 = self.fc_attention4(y4)
        y4 = torch.sigmoid(y4).view(y4.size(0), y4.size(1), -1)
        x = x4 * y4 + y4

        x5 = self.block5(x)
        y5 = self.avgpool(x5).view(x5.size(0), -1)
        y5 = self.fc_attention5(y5)
        y5 = torch.sigmoid(y5).view(y5.size(0), y5.size(1), -1)
        x = x5 * y5 + y5

        x = self.bn_before_gru(x)
        x = self.selu(x)
        
        # GRU input: (batch, seq, feature)
        x = x.permute(0, 2, 1)  
        self.gru.flatten_parameters()
        x, _ = self.gru(x)
        
        # Take last time step
        x = x[:, -1, :] 
        
        x = self.fc1_gru(x)
        x = self.fc2_gru(x)
        
        return x
